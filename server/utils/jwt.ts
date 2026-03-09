import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "shartnoma-uz-secret-key-change-in-production";
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
    userId: number;
    email: string;
    isAdmin: boolean;
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secretKey);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, secretKey);
    return {
          userId: payload.userId as number,
          email: payload.email as string,
          isAdmin: payload.isAdmin as boolean,
    };
}
