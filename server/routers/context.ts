import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { db } from "../db";
import { verifyToken } from "../utils/jwt";

export async function createContext({ req }: CreateExpressContextOptions) {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  let user = null;
    if (token) {
          try {
                  user = await verifyToken(token);
          } catch {
                  // invalid token
          }
    }

  return { req, db, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
