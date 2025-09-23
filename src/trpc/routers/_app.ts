import { createTRPCRouter } from "../init";

import { categoriesRouter } from "@/modules/categories/server/procedures";

export const appRouter = createTRPCRouter({
  categories: categoriesRouter,

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
