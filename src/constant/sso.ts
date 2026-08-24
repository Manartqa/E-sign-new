/**
 * Client-safe SSO constants.
 *
 * `src/lib/sso.ts` holds the server half (client secret, token refresh); it
 * must never be imported from a client component, hence this split.
 */

/** NextAuth provider id → callback URL `{NEXTAUTH_URL}/api/auth/callback/sso` */
export const SSO_PROVIDER_ID = "sso";

/** Mirrors `isSsoConfigured` on the server; drives the login screen's button. */
export const IS_SSO_ENABLED = process.env.NEXT_PUBLIC_SSO_ENABLED === "true";

/** `?error=` values NextAuth appends when the SSO round-trip fails. */
export const SSO_ERROR_MESSAGE = "เข้าสู่ระบบด้วย SSO ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
