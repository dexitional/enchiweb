// Sessions for staff signed in with Google (the self-service directory
// listing). Server-only: imported by Hono modules, never by routes.
//
// Signed with a key derived from ADMIN_SESSION_SECRET rather than the secret
// itself, so a staff token can never pass as an admin token (both carry a
// numeric `sub`) and no extra secret has to be configured.
import { createHmac } from "node:crypto";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { getPool } from "@enchi/db";
import type { StaffAccountRow } from "@enchi/db";
import type { RowDataPacket } from "mysql2";
import { AppError } from "./api/middleware/error-handler.js";

export const STAFF_SESSION_COOKIE = "enchi_staff_session";
export const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

declare module "hono" {
  interface ContextVariableMap {
    staff: StaffAccountRow;
  }
}

function staffSessionKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set to at least 32 characters.");
  }
  return createHmac("sha256", secret).update("enchiweb:staff-session:v1").digest("hex");
}

export async function signStaffToken(accountId: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: accountId,
      aud: "staff",
      iat: now,
      exp: now + STAFF_SESSION_TTL_SECONDS,
    },
    staffSessionKey(),
    "HS256",
  );
}

async function readStaffId(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const payload = await verify(token, staffSessionKey(), "HS256");
    if (payload.aud !== "staff") return null;
    const id = Number(payload.sub);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export async function accountFromToken(token: string | undefined): Promise<StaffAccountRow | null> {
  const id = await readStaffId(token);
  if (!id) return null;
  const [rows] = await getPool().execute<RowDataPacket[]>(
    "SELECT * FROM staff_accounts WHERE id = ?",
    [id],
  );
  return (rows[0] as StaffAccountRow | undefined) ?? null;
}

export function getStaffAccount(c: Context) {
  return accountFromToken(getCookie(c, STAFF_SESSION_COOKIE));
}

const listOf = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);

// Which sign-in options the listing page offers.
export function staffAuthConfig() {
  return {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    // Local development without Google credentials. Never in production builds.
    devLogin: process.env.NODE_ENV !== "production" && process.env.STAFF_DEV_LOGIN === "true",
    domains: listOf(process.env.STAFF_EMAIL_DOMAINS),
  };
}

export async function requireStaff(c: Context, next: Next) {
  const account = await getStaffAccount(c);
  if (!account) throw new AppError("Please sign in with Google.", 401);
  c.set("staff", account);
  await next();
}
