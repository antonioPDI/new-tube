import { HydrateClient, trpc } from "@/trpc/server";
import { PageClient } from "./client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
// If you want to prefetch data on the server and then
// hydrate it on the client, you can do so like this.

export default async function Home() {
  void trpc.hello.prefetch({ text: "Antonio" });
  return (
    <HydrateClient>
      <Suspense fallback={<div>Loading client...</div>}>
        <ErrorBoundary fallback={<div>Error loading client</div>}>
          <PageClient />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
