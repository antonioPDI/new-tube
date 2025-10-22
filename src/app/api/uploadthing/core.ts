import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import z from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(z.object({ videoId: z.uuid() }))
    .middleware(async ({ input }) => {
      const { userId: clerkUserId } = await auth();

      if (!clerkUserId) throw new UploadThingError("Unauthorized");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId));

      if (!user) throw new UploadThingError("Unauthorized");

      // prettier-ignore
      const [existingVideo] = await db
        .select({
            thumbnailKey: videos.thumbnailKey,
        })
        .from(videos)
        .where(and(
            eq(videos.id, input.videoId), 
            eq(videos.userId, user.id))
        );
      if (!existingVideo) throw new UploadThingError("Video not found");

      if (existingVideo.thumbnailKey) {
        const utapi = new UTApi();
        await utapi.deleteFiles(existingVideo.thumbnailKey);
        // prettier-ignore
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null })
          .where(and(
              eq(videos.id, input.videoId), 
              eq(videos.userId, user.id))
          );
      }

      // NOTE: proper cleanup before we do onUploadComplete to avoid orphaned files

      return { user, ...input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload

      await db
        .update(videos)
        .set({ thumbnailUrl: file.url, thumbnailKey: file.key })
        .where(
          and(eq(videos.id, metadata.videoId), eq(videos.userId, metadata.user.id)),
        );

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter; // esta palabra clave asegura que nuestro enrutador cumple con la forma esperada

export type OurFileRouter = typeof ourFileRouter;
