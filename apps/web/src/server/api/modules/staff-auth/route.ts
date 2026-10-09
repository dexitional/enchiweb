// "Sign in with Google" for staff managing their own directory listing.
// Standard OAuth 2.0 authorization-code flow, server side:
//   GET /api/staff-auth/google           → redirect to Google's consent screen
//   GET /api/staff-auth/google/callback  → exchange the code, start a session
//   POST /api/staff-auth/logout
//
// Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, with the redirect URI
// {APP_URL}/api/staff-auth/google/callback registered in Google Cloud.
// STAFF_EMAIL_DOMAINS (optional, comma-separated) limits sign-in to those
// email domains, e.g. "enchicoe.edu.gh".
import { randomBytes } from "node:crypto";
import { Hono } from "hono";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { getPool } from "@enchi/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_TTL_SECONDS,
  signStaffToken,
  staffAuthConfig,
} from "#/server/staff-session";

const STATE_COOKIE = "enchi_staff_oauth";
const LISTING_PATH = "/directory/my-listing";
const secure = () => process.env.NODE_ENV === "production";

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

function redirectUri(c: Context) {
  const base = (process.env.APP_URL || new URL(c.req.url).origin).replace(/\/$/, "");
  return `${base}/api/staff-auth/google/callback`;
}

// Where to send the browser back to: our listing page, with an error code if
// sign-in failed (the page explains it).
const back = (c: Context, error?: string) =>
  c.redirect(error ? `${LISTING_PATH}?error=${error}` : LISTING_PATH, 302);

function allowedDomain(email: string) {
  const { domains } = staffAuthConfig();
  return domains.length === 0 || domains.includes(email.split("@")[1]?.toLowerCase() ?? "");
}

async function startSession(
  c: Context,
  profile: {
    sub: string;
    email: string;
    name: string | null;
    picture: string | null;
  },
) {
  const pool = getPool();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO staff_accounts (google_sub, email, name, picture_url, last_login_at)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name),
       picture_url = VALUES(picture_url), last_login_at = NOW()`,
    [profile.sub, profile.email, profile.name, profile.picture],
  );
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT id FROM staff_accounts WHERE google_sub = ?",
    [profile.sub],
  );
  setCookie(c, STAFF_SESSION_COOKIE, await signStaffToken(rows[0]!.id as number), {
    httpOnly: true,
    secure: secure(),
    sameSite: "Lax",
    path: "/",
    maxAge: STAFF_SESSION_TTL_SECONDS,
  });
}

// The id_token's payload. It comes straight from Google's token endpoint over
// TLS in exchange for our client secret, so (per OpenID Connect Core 3.1.3.7)
// its signature need not be re-verified; issuer and audience still are.
function decodeIdToken(idToken: string): Record<string, unknown> | null {
  try {
    const part = idToken.split(".")[1];
    return part
      ? (JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export const staffAuthRoute = new Hono()
  .get("/config", (c) => c.json(staffAuthConfig()))
  .get("/google", (c) => {
    const config = googleConfig();
    if (!config) return back(c, "not_configured");
    const state = randomBytes(24).toString("base64url");
    setCookie(c, STATE_COOKIE, state, {
      httpOnly: true,
      secure: secure(),
      sameSite: "Lax",
      path: "/api/staff-auth",
      maxAge: 600,
    });
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri(c),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    const { domains } = staffAuthConfig();
    if (domains.length === 1) params.set("hd", domains[0]!);
    return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
  })
  .get("/google/callback", async (c) => {
    const config = googleConfig();
    if (!config) return back(c, "not_configured");
    const expected = getCookie(c, STATE_COOKIE);
    deleteCookie(c, STATE_COOKIE, { path: "/api/staff-auth" });
    const { code, state, error } = c.req.query();
    if (error) return back(c, "cancelled");
    if (!code || !state || !expected || state !== expected) return back(c, "invalid_state");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri(c),
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    if (!res?.ok) return back(c, "google_failed");
    const tokens = (await res.json()) as { id_token?: string };
    const claims = tokens.id_token ? decodeIdToken(tokens.id_token) : null;
    if (
      !claims ||
      claims.aud !== config.clientId ||
      !["accounts.google.com", "https://accounts.google.com"].includes(String(claims.iss)) ||
      typeof claims.sub !== "string" ||
      typeof claims.email !== "string" ||
      claims.email_verified !== true
    ) {
      return back(c, "google_failed");
    }
    const email = claims.email.toLowerCase();
    if (!allowedDomain(email)) return back(c, "domain");
    await startSession(c, {
      sub: claims.sub,
      email,
      name: typeof claims.name === "string" ? claims.name : null,
      picture: typeof claims.picture === "string" ? claims.picture : null,
    });
    return back(c);
  })
  // Local development without Google credentials (STAFF_DEV_LOGIN=true): signs
  // in as any email. Never available in production builds.
  .get("/dev", async (c) => {
    if (!staffAuthConfig().devLogin) return c.json({ error: "Not found" }, 404);
    const email = (c.req.query("email") ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return c.json({ error: "Pass ?email=" }, 400);
    await startSession(c, {
      sub: `dev:${email}`,
      email,
      name: null,
      picture: null,
    });
    return back(c);
  })
  .post("/logout", (c) => {
    deleteCookie(c, STAFF_SESSION_COOKIE, { path: "/" });
    return c.json({ ok: true });
  });
