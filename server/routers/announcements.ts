import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./index";
import { announcements } from "../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const announcementsRouter = router({
    getPublished: publicProcedure.query(async ({ ctx }) => {
          return ctx.db.query.announcements.findMany({
                  where: eq(announcements.isPublished, true),
          });
    }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
          if (!ctx.user.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
          return ctx.db.query.announcements.findMany();
    }),

    create: protectedProcedure
      .input(z.object({
              title: z.string(),
              content: z.string(),
              isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
              if (!ctx.user.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
              const [result] = await ctx.db.insert(announcements).values({
                        title: input.title,
                        content: input.content,
                        isPublished: input.isPublished ?? false,
                        createdBy: ctx.user.userId,
              });
              return ctx.db.query.announcements.findFirst({
                        where: eq(announcements.id, (result as any).insertId),
              });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
              if (!ctx.user.isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
              await ctx.db.delete(announcements).where(eq(announcements.id, input.id));
              return { success: true };
      }),
});
