import { z } from "zod";
import {  createTRPCRouter, protectedProcedure } from "../init";
export const appRouter = createTRPCRouter({
  hello: protectedProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      // console.log({fromContext: opts.ctx.clerkUserId});
      console.log({dbUser: opts.ctx.user});
      return {
        greeting: `hello from router/_app  ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
