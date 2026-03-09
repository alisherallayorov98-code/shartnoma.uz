import { z } from "zod";
import { router, protectedProcedure } from "./index";
import { counterparties } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const counterpartiesRouter = router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
          return ctx.db.query.counterparties.findMany({
                  where: eq(counterparties.userId, ctx.user.userId),
          });
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
              return ctx.db.query.counterparties.findFirst({
                        where: and(eq(counterparties.id, input.id), eq(counterparties.userId, ctx.user.userId)),
              });
      }),

    create: protectedProcedure
      .input(z.object({
              name: z.string(),
              inn: z.string().optional(),
              address: z.string().optional(),
              phone: z.string().optional(),
              email: z.string().optional(),
              bankAccount: z.string().optional(),
              bankName: z.string().optional(),
              mfo: z.string().optional(),
              type: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
              const [result] = await ctx.db.insert(counterparties).values({
                        userId: ctx.user.userId,
                        ...input,
              });
              return ctx.db.query.counterparties.findFirst({
                        where: eq(counterparties.id, (result as any).insertId),
              });
      }),

    update: protectedProcedure
      .input(z.object({
              id: z.number(),
              name: z.string().optional(),
                                        inn: z.string().optional(),
              address: z.string().optional(),
              phone: z.string().optional(),
              email: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
              const { id, ...data } = input;
              await ctx.db.update(counterparties).set(data).where(
                        and(eq(counterparties.id, id), eq(counterparties.userId, ctx.user.userId))
                      );
              return ctx.db.query.counterparties.findFirst({ where: eq(counterparties.id, id) });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
              await ctx.db.delete(counterparties).where(
                        and(eq(counterparties.id, input.id), eq(counterparties.userId, ctx.user.userId))
                      );
              return { success: true };
      }),
});
