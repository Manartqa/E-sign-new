import type { NextResponse } from "next/server";

/**
 * NextAuth's session cookie, shared by the NextAuth config, the proxy and the
 * logout route — all three must agree on the name and the path.
 *
 * The cookie is named and scoped after the basePath, so two apps served from
 * one domain under different basePaths never overwrite each other's session.
 * With no basePath it is NextAuth's default name at Path=/.
 */

/** "" when served at the root, otherwise e.g. "/e-sign" (no trailing slash) */
export const BASE_PATH = (process.env.NEXT_BASE_PATH ?? "").replace(/\/+$/, "");

export const SESSION_COOKIE_PATH = BASE_PATH || "/";

/** secure only from NODE_ENV — never guessed from a URL string */
export const IS_SECURE_COOKIE = process.env.NODE_ENV === "production";

const cookiePrefix =
  BASE_PATH.replace(/^\/+/, "").replace(/\//g, "-") || "next-auth";

export const SESSION_COOKIE_NAME = `${IS_SECURE_COOKIE ? "__Secure-" : ""}${cookiePrefix}.session-token`;

/** NextAuth splits a large JWT into `name.0`, `name.1`, … */
const SESSION_COOKIE_CHUNKS = Number(process.env.SESSION_COOKIE_CHUNKS) || 10;

/** Expire the session cookie and every chunk of it on `response`. */
export function clearSessionCookie(response: NextResponse) {
  const names = [
    SESSION_COOKIE_NAME,
    ...Array.from(
      { length: SESSION_COOKIE_CHUNKS + 1 },
      (_, i) => `${SESSION_COOKIE_NAME}.${i}`,
    ),
  ];
  for (const name of names) {
    response.cookies.set(name, "", {
      maxAge: 0,
      // must match the Path the cookie was set with, or the browser keeps it
      path: SESSION_COOKIE_PATH,
      httpOnly: true,
      sameSite: "lax",
      secure: IS_SECURE_COOKIE,
    });
  }
  return response;
}
