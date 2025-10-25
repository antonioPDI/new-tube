// https://localhost:3000/api/videos/workflows/title

import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

interface InputType {
  userId: string;
  videoId: string;
  prompt: string;
}
/**
 * @brief Define a workflow to handle video title processing.
 *
 * @explanation workflow es una función proporcionada por Upstash Workflow que permite
 * definir una serie de pasos (steps) que se ejecutan en secuencia. Cada paso puede
 * realizar tareas específicas y pasar datos al siguiente paso. Esto es útil para
 * orquestar procesos complejos que requieren múltiples etapas de procesamiento. Cada
 * paso se define mediante el método `context.run`, que toma el nombre del paso y una
 * función que contiene la lógica a ejecutar en ese paso. Cada paso puede acceder a los
 * resultados de los pasos anteriores y pasar datos al siguiente paso. Los workflows
 * son especialmente útiles para manejar tareas asíncronas y procesos que requieren
 * coordinación entre múltiples servicios o componentes. Por poner un ejemplo, en un
 * sistema de procesamiento de videos, un workflow podría incluir pasos para subir el
 * video, procesarlo, generar miniaturas y notificar al usuario una vez que el video
 * esté listo.
 */
export const { POST } = serve(async (context) => {
  const utapi = new UTApi();
  const input = context.requestPayload as InputType;
  const { userId, videoId, prompt } = input;

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (![existingVideo][0]) throw new Error("Video not found");
    return [existingVideo][0];
  });

  /** NOTE: I did not make this part identically as Antonio (Code with Antonio) do in the tutorial  */
  type ImageModel = "dall-e-2" | "dall-e-3" | "gpt-image-1";

  interface OpenAIImageGenRequest {
    model?: ImageModel; // default: dall-e-2
    prompt: string;
    n?: number; // dall-e-3: solo 1
    size?: "1024x1024" | "1792x1024" | "1024x1792" | string;
    response_format?: "url" | "b64_json"; // gpt-image-1 siempre b64 (ignora este flag)
    // gpt-image-1 extra: output_format, background, quality, etc.
  }

  interface OpenAIImageGenResponse {
    created: number;
    data: Array<{
      url?: string; // si response_format = 'url' (DA/DE 2/3)
      b64_json?: string; // si response_format = 'b64_json' o gpt-image-1
      revised_prompt?: string;
    }>;
    background?: string;
    output_format?: "png" | "jpeg" | "webp";
    size?: string;
    quality?: string;
    usage?: unknown;
  }

  // como tipo lo que retorna este call?
  // type GenerateThumbnailResponse = {
  //   created: number;
  //   data: Array<{
  //     b64_json: string;
  //   }>;
  //   background: string;
  //   output_format: string;
  //   size: string;
  //   quality: string;
  //   usage: {
  //     total_tokens: number;
  //     input_tokens: number;
  //     output_tokens: number;
  //     input_tokens_details: {
  //       text_tokens: number;
  //       image_tokens: number;
  //     };
  //   };
  // };
  const { body } = await context.call<OpenAIImageGenResponse>("generate-thumbnail", {
    url: "https://api.openai.com/v1/images/generations",
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: {
      model: "dall-e-3",
      prompt,
      n: 1, // obligatorio 1 en dall-e-3
      size: "1792x1024",
      response_format: "url", // o "b64_json"
      // style: "vivid" | "natural" (opcional, solo dall-e-3)
    } satisfies OpenAIImageGenRequest,
  });

  const tempThumnailUrl = body?.data?.[0].url;
  if (!tempThumnailUrl) throw new Error("Image generation returned no data");

  //clean up our thumbnail url from openai
  await context.run("cleanup-thumbnail", async () => {
    if (video.thumbnailKey) {
      await utapi.deleteFiles(video.thumbnailKey);
      await db
        .update(videos)
        .set({
          thumbnailKey: null,
          thumbnailUrl: null,
        })
        .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
    }
  });

  const uploadedThumnail = await context.run("upload-thumbnail", async () => {
    const { data } = await utapi.uploadFilesFromUrl(tempThumnailUrl);

    if (!data) {
      throw new Error("Bad Request. Failed to upload thumbnail");
    }
    return data;
  });

  // const { body } = await context.call("generate-thumbnail", {
  //   // more info: https://platform.openai.com/docs/api-reference/images
  //   url: "https://api.openai.com/v1/images/generations",
  //   method: "POST",

  //   body: {
  //     model: "dall-e-3",
  //     prompt,
  //     // number of images to generate
  //     n: 1,
  //     size: "1792x1024",
  //   },
  //   headers: {
  //     Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
  //     // "Content-Type": "application/json",
  //   },
  // });

  // OBJECT the image generation response
  //   {
  //   "created": 1713833628,
  //   "data": [
  //     {
  //       "b64_json": "..."
  //     }
  //   ],
  //   "background": "transparent",
  //   "output_format": "png",
  //   "size": "1024x1024",
  //   "quality": "high",
  //   "usage": {
  //     "total_tokens": 100,
  //     "input_tokens": 50,
  //     "output_tokens": 50,
  //     "input_tokens_details": {
  //       "text_tokens": 10,
  //       "image_tokens": 40
  //     }
  //   }
  // }

  // objeto tipado de forma más segura

  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        thumbnailKey: uploadedThumnail.key,
        thumbnailUrl: uploadedThumnail.url,
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });
});
