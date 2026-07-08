import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "kp_session";

// SECURITY: Fail-fast if JWT_SECRET is missing in production.
// Without this, all sessions can be forged using the hardcoded fallback key.
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error(
    "[FATAL] JWT_SECRET env var tidak diset di mode production. " +
    "Set JWT_SECRET ke string random 64+ karakter sebelum deploy."
  );
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-insecure-secret-change-me"
);
const EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN_SECONDS || 2592000); // 30 days

export interface SessionPayload {
  sub: string; // user id
  username: string;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: {
  sub: string;
  username: string;
}): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .sign(SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRES_IN,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      plan: true,
      planExpiresAt: true,
      createdAt: true,
    },
  });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
