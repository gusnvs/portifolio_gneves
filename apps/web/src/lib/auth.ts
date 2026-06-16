import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

export type SessionData = { admin?: boolean };

const sessionPassword =
  process.env.SESSION_SECRET ?? "dev-only-insecure-session-secret-change-me-1234567890";

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "gn_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function isAdmin() {
  const session = await getSession();
  return Boolean(session.admin);
}

function constantTimeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // still run a comparison to avoid trivial length timing leak
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** Verify a login attempt against ADMIN_PASSWORD_HASH (bcrypt) or ADMIN_PASSWORD (plain). */
export async function verifyAdminPassword(input: string): Promise<boolean> {
  if (!input) return false;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return bcrypt.compare(input, hash);
  const plain = process.env.ADMIN_PASSWORD;
  if (plain) return constantTimeEqual(input, plain);
  return false;
}
