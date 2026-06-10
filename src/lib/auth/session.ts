import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "dr_it_session";
const maxAgeSeconds = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  role: UserRole;
  exp: number;
};

export async function createSession(user: { id: string; role: UserRole }) {
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const token = await signSession(payload);
  const cookieStore = await cookies();
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "";
  const isSecure = proto === "https";
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getCurrentUser() {
  const payload = await getSessionPayload();
  if (!payload) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized admin action");
  }
  return user;
}

export async function signSession(payload: SessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = await sign(encodedPayload);
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.userId || !payload.role || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function sign(value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncodeBuffer(new Uint8Array(signature));
}

function base64UrlEncode(value: string) {
  return base64UrlEncodeBuffer(new TextEncoder().encode(value));
}

function base64UrlEncodeBuffer(buffer: Uint8Array) {
  return Buffer.from(buffer).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}
