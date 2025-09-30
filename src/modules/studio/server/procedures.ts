import { db } from "@/db";
import { videos } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { z } from "zod";

// only responsible for loading videos on studio page
export const studioRouter = createTRPCRouter({
  // NOTE: only want to be visible by the owner of the videos, for that reason we use protectedProcedure in studioRouter not in videosRouter
  // in videosRouter we use protectedProcedure for creating videos, but not for getting them, because they are public
  // here in studioRouter we want to get only the videos of the logged in user
  getOne: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const { id } = input;

      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.id, id), eq(videos.userId, userId)));

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      return video;
    }),

  getMany: protectedProcedure

    .input(
      z.object({
        cursor: z
          .object({
            id: z.string().uuid(),
            updatedAt: z.date(),
          })
          .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )

    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;
      const { id: userId } = ctx.user;

      const data = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.userId, userId),
            cursor
              ? or(
                  lt(videos.updatedAt, cursor.updatedAt),
                  and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id)),
                )
              : undefined,
          ),
        )
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        // add limit + 1 to check if there's more data
        .limit(limit + 1);

      const hasMore = data.length > limit;
      // Remove the last item if we have more data
      const items = hasMore ? data.slice(0, -1) : data;

      //Set the next cursor to the last item if we have more data
      const lastItem = items[items.length - 1];

      const nextCursor = hasMore ? { id: lastItem.id, updatedAt: lastItem.updatedAt } : null;

      return { items, nextCursor };
    }),
});
