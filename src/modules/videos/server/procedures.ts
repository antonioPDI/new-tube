import { db } from "@/db";
import { videos } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const videosRouter = createTRPCRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user;

    // in order to test error handling in the client
    // throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Video creation not implemented yet" });

    const [video] = await db.insert(videos).values({ userId, title: "Untitled" }).returning();

    return {
      video: video,
    };
  }),
});
