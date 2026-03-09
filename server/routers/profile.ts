import { z } from "zod";
import { router, protectedProcedure } from "./index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const profileRouter = router({
    get: protectedProcedure.query(async ({ ctx }) => {
          return ctx.db.query.users.findFirst({
                  where: eq(users.id, ctx.user.userId),
          });
    }),

    update: protectedProcedure
      .input(z.object({
              name: z.string().optional(),
              companyName: z.string().optional(),
              phone: z.string().optional(),
              address: z.string().optional(),
              bankDetails: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
              await ctx.db.update(users).set(input).where(eq(users.id, ctx.user.userId));
              return ctx.db.query.users.findFirst({ where: eq(users.id, ctx.user.userId) });
      }),
});
