// https://localhost:3000/api/videos/workflows/title

import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";

interface InputType {
  userId: string;
  videoId: string;
}
const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;

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
  const input = context.requestPayload as InputType;
  const { userId, videoId } = input;

  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (![existingVideo][0]) throw new Error("Video not found");
    return [existingVideo][0];
  });

  const { body } = await context.api.openai.call("generate-title", {
    token: process.env.OPENAI_API_KEY!,
    operation: "chat.completions.create",
    body: {
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: TITLE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Generate a catchy and concise title for a video based on the following description: ${video.description}`,
        },
      ],
    },
  });

  // Código Corregido y más seguro
  const title = body.choices?.[0]?.message?.content ?? video.title;

  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        title: title || video.title,
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });
});
