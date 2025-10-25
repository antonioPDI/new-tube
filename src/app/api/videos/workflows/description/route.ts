// https://localhost:3000/api/videos/workflows/title

import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";

interface InputType {
  userId: string;
  videoId: string;
}
const DESCRIPTION_SYSTEM_PROMPT = `Your task is to summarize the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.`;

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

  const transcript = await context.run("get-transcript", async () => {
    const trackUrl = `https:stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
    const response = await fetch(trackUrl);
    const text = await response.text();
    if (!text) throw new Error("Bad Request: Transcript not found");
    return text;
  });

  const { body } = await context.api.openai.call("generate-description", {
    token: process.env.OPENAI_API_KEY!,
    operation: "chat.completions.create",
    body: {
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: DESCRIPTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    },
  });
  //coment

  // Código Corregido y más seguro
  const description = body.choices[0]?.message.content;
  if (!description) {
    throw new Error("Failed to generate description");
  }

  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        description: description || video.description,
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });
});
