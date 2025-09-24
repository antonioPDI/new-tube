import { categoriesRouter } from "@/modules/categories/server/procedures";
import { studioRouter } from "@/modules/studio/server/procedures";
import { videosRouter } from "@/modules/videos/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  studio: studioRouter,
  videos: videosRouter,

  //   hello: protectedProcedure
  //     .input(
  //       z.object({
  //         text: z.string(),
  //       })
  //     )
  //     .query((opts) => {
  //       // console.log({fromContext: opts.ctx.clerkUserId});
  //       console.log({dbUser: opts.ctx.user});
  //       return {
  //         greeting: `hello from router/_app  ${opts.input.text}`,
  //       };
  //     }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
