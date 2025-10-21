// https://localhost:3000/api/videos/workflows/title

import { serve } from "@upstash/workflow/nextjs";

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
  await context.run("initial-step", () => {
    console.log("initial step ran");
  });

  await context.run("second-step", () => {
    console.log("second step ran");
  });
});
