import { z } from "zod";
import { router, protectedProcedure } from "./index";
import { contracts } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export const contractsRouter = router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
          return ctx.db.query.contracts.findMany({
                  where: eq(contracts.userId, ctx.user.userId),
                  orderBy: [desc(contracts.createdAt)],
          });
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
              return ctx.db.query.contracts.findFirst({
                        where: and(eq(contracts.id, input.id), eq(contracts.userId, ctx.user.userId)),
              });
      }),

    create: protectedProcedure
      .input(
              z.object({
                        title: z.string(),
                        type: z.string(),
                        language: z.string().optional(),
                        counterpartyId: z.number().optional(),
                        contractData: z.any().optional(),
                        contractNumber: z.string().optional(),
                        amount: z.string().optional(),
                        startDate: z.string().optional(),
                        endDate: z.string().optional(),
              })
            )
      .mutation(async ({ ctx, input }) => {
              const [result] = await ctx.db.insert(contracts).values({
                        userId: ctx.user.userId,
                        title: input.title,
                        type: input.type,
                        language: input.language ?? "uz",
                        counterpartyId: input.counterpartyId,
                        contractData: input.contractData,
                        contractNumber: input.contractNumber,
                        amount: input.amount,
                        status: "draft",
              });
              return ctx.db.query.contracts.findFirst({
                        where: eq(contracts.id, (result as any).insertId),
              });
      }),

    update: protectedProcedure
      .input(
              z.object({
                        id: z.number(),
                        title: z.string().optional(),
                        status: z.string().optional(),
                        contractData: z.any().optional(),
                        amount: z.string().optional(),
              })
            )
      .mutation(async ({ ctx, input }) => {
              const { id, ...data } = input;
              await ctx.db.update(contracts).set(data).where(
                        and(eq(contracts.id, id), eq(contracts.userId, ctx.user.userId))
                      );
              return ctx.db.query.contracts.findFirst({ where: eq(contracts.id, id) });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
              await ctx.db.delete(contracts).where(
                        and(eq(contracts.id, input.id), eq(contracts.userId, ctx.user.userId))
                      );
              return { success: true };
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
          const all = await ctx.db.query.contracts.findMany({
                  where: eq(contracts.userId, ctx.user.userId),
          });
          const now = new Date();
          const thisMonth = all.filter((c) => {
                  const d = c.createdAt ? new Date(c.createdAt) : null;
                  return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          });
          return {
                  total: all.length,
                  thisMonth: thisMonth.length,
                  drafts: all.filter((c) => c.status === "draft").length,
                  signed: all.filter((c) => c.status === "signed").length,
          };
    }),
});
