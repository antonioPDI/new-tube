"use client";

import { trpc } from "@/trpc/client";

export const PageClient = () => {
  /** 
   * NOTE *********** *********** *********** 
   * Si usas useSuspenseQuery en un Client Component, necesitas envolverlo con <Suspense> 
   * (y opcionalmente un ErrorBoundary) y, si quieres que no suspenda al hidratar, hacer 
   * prefetch en el servidor + hydrate.
   */
    const [data] = trpc.hello.useSuspenseQuery({ text: "Antonio" });
  return <div>Page Client says {data.greeting}</div>;
};
