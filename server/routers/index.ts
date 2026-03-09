import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";
import { authRouter } from "./auth";
import { contractsRouter } from "./contracts";
import { counterpartiesRouter } from "./counterparties";
import { announcementsRouter } from "./announcements";
import { profileRouter } from "./profile";

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const appRouter = router({
    auth: authRouter,
    contracts: contractsRouter,
    counterparties: counterpartiesRouter,
    announcements: announcementsRouter,
    profile: profileRouter,
});

export type AppRouter = typeof appRouter;
