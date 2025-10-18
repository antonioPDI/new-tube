import { db } from "@/db";
import { videos, videoUpdateSchema } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";
/**
 * @brief This router handles video-related operations such as creating, updating,
 * restoring thumbnails, and removing videos. It uses Drizzle ORM for database
 * interactions and Mux for video uploads. All procedures are protected and require
 * user authentication.
 * @note Ensure that the Mux configuration and database schema are correctly set up
 * before using this router.
 * @module videosRouter
 * @requires db
 * @requires mux
 * @requires createTRPCRouter
 * @requires protectedProcedure
 * @requires TRPCError
 * @requires drizzle-orm
 * @requires zod
 * @exports videosRouter
 * @explanation This router provides a set of procedures to manage videos in the application.
 * Each procedure is protected, meaning that only authenticated users can access them. The router
 * allows users to create new videos, update existing ones, restore thumbnails from Mux, and remove
 * videos from the database. It leverages Drizzle ORM for database operations and Mux for handling
 * video uploads and processing.
 */
/**
 * @explanation The `videosRouter` is a tRPC router that manages video-related operations. It acts 
 * like a controller in MVC architecture. It includes procedures for creating, updating, restoring 
 * thumbnails, and deleting videos. Each procedure is protected, ensuring that only authenticated 
 * users can perform these actions. The router interacts with the database using Drizzle ORM and 
 * handles video uploads through Mux.
 * It is also like api REST endpoints but more type-safe and integrated with the tRPC framework.
 * query: read (equivalent to GET). mutation: write (equivalent to POST/PUT/PATCH/DELETE).
 * Routers group related procedures, similar to how REST endpoints are grouped by resource.
 * tRPC replaces REST endpoints with typed “procedures” (query=read, mutation=write) grouped in routers.
 * Input/output contracts are defined with Zod/TypeScript on the server and inferred on the client (end-to-end type safety).
 * Auth via middlewares/protectedProcedure; video logic handled with Drizzle ORM + Mux.
 * Think REST, but without manual fetches/duplicated DTOs/SDKs—call typed functions directly from the client.
 */
export const videosRouter = createTRPCRouter({
  /**
   * @description Restores the thumbnail for a video using its Mux playback ID.
   * @param {Object} input - The input object containing the video ID.
   * @param {string} input.id - The UUID of the video.
   * @returns {Object} The updated video record with the restored thumbnail URL.
   * @throws {TRPCError} Throws a NOT_FOUND error if the video does not exist.
   * @throws {TRPCError} Throws a BAD_REQUEST error if the video has no playback ID.
   * @explanation This procedure allows an authenticated user to restore the thumbnail of a video
   * by utilizing the Mux playback ID associated with that video. It first verifies the existence
   * of the video and checks if it has a valid playback ID. If both conditions are met, it constructs
   * the thumbnail URL and updates the video record in the database.
   * @question How can I use this procedure to restore a video's thumbnail?
   * @answer You can call this procedure by providing the video ID as input. If the video exists
   * and has a Mux playback ID, the thumbnail URL will be restored and returned in the updated video record.
   * @question Where can I use or call this procedure in my application?
   * @answer You can call this procedure from any part of your application that requires restoring
   * a video's thumbnail, such as an admin panel or a user dashboard where video management is performed.
   * @question How can I use this procedure in a client-side component?
   * @answer You can use this procedure in a client-side component by utilizing your tRPC client instance.
   * Simply call the `restoreThumbnail` mutation with the appropriate video ID when needed, such as
   * in response to a user action like clicking a "Restore Thumbnail" button.
   */
  //* Restore thumbnail for a video using its Mux playback ID
  restoreThumbnail: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      // prettier-ignore
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.id, input.id), 
            eq(videos.userId, userId)
          )
        )

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      if (!existingVideo.muxPlaybackId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Video has no playback ID",
        });
      }

      const thumbnailUrl = `https://image.mux.com/${existingVideo.muxPlaybackId}/thumbnail.jpg`;

      /** @question Why here we use [updatedVideo] with brackets? */
      /** @answer Because we expect a single video to be updated and returned, but the database query returns an array*/
      
      // prettier-ignore
      const [updatedVideo] = await db
        .update(videos)
        .set({ thumbnailUrl })
        .where(
          and(
            eq(videos.id, input.id), 
            eq(videos.userId, userId)
          )
        )
        .returning();

      return updatedVideo;
    }),

  //* Delete a video by its ID
  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      const [removedVideo] = await db
        .delete(videos)

        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!removedVideo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      return removedVideo;
    }),

  //* Update video details
  update: protectedProcedure
    .input(videoUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;

      if (!input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Video ID is required",
        });
      }

      const [updatedVideo] = await db
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility as "private" | "public",
          updatedAt: new Date(),
        })
        .where(and(eq(videos.id, input.id), eq(videos.userId, userId)))
        .returning();

      if (!updatedVideo) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }
      return updatedVideo;
    }),

  //* Create a new video entry and initiate Mux upload
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        passthrough: userId,
        playback_policy: ["public"],
        input: [
          {
            // NOTE: para que el track este ready debemos hacer el tunnel de ngrok, por que? Porque mux necesita acceder a la url del video para procesarlo
            // si no lo hacemos, mux no puede acceder a la url del video y el track nunca llega a estar ready
            generated_subtitles: [
              {
                language_code: "en",
                name: "English",
              },
            ],
          },
        ],
      },
      cors_origin: "*", //TODO: in production set to our domain
    });

    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: "Untitled",
        muxStatus: "waiting",
        muxUploadId: upload.id,
      })
      .returning();

    return {
      video: video,
      url: upload.url,
    };
  }),
});
