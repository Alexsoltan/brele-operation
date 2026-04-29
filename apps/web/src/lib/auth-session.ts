import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "brele_session_v2";
const OLD_SESSION_COOKIE = "brele_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }

  return secret;
}

type SessionPayload = {
  userId: string;
  exp: number;
};

function sign(data: string) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(data)
    .digest("hex");
}

function encode(payload: SessionPayload) {
  const json = JSON.stringify(payload);
  const base = Buffer.from(json).toString("base64url");
  const signature = sign(base);

  return `${base}.${signature}`;
}

function decode(token: string): SessionPayload | null {
  try {
    const [base, signature] = token.split(".");

    if (!base || !signature) return null;

    const expected = sign(base);

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      )
    ) {
      return null;
    }

    const json = Buffer.from(base, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as SessionPayload;

    if (!payload.userId || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setSession(userId: string) {
  const payload: SessionPayload = {
    userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };

  cookies().set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  cookies().delete(OLD_SESSION_COOKIE);
}

export function getSessionUserId(): string | null {
  const token = cookies().get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const payload = decode(token);

  return payload?.userId ?? null;
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE);
  cookies().delete(OLD_SESSION_COOKIE);
}