/**
 * Client-safe SSO constants.
 *
 * `src/lib/sso.ts` holds the server half (client secret, token refresh); it
 * must never be imported from a client component, hence this split.
 */

/** NextAuth provider id → callback URL `{NEXT_BASE_URL}/api/auth/callback/sso` */
export const SSO_PROVIDER_ID = "sso";

/** Mirrors `isSsoConfigured` on the server; drives the login screen's button. */
export const IS_SSO_ENABLED = process.env.NEXT_PUBLIC_SSO_ENABLED === "true";

/** "" when served at the root, otherwise e.g. "/e-sign" */
export const PUBLIC_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
  /\/+$/,
  "",
);

/** Full logout: revokes the tokens and ends the SSO session (server route). */
export const LOGOUT_URL = `${PUBLIC_BASE_PATH}/api/auth/logout`;

export const SSO_ERROR_MESSAGE = "เข้าสู่ระบบด้วย SSO ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

/**
 * `?error=` codes NextAuth appends when sign-in fails, mapped to fixed text.
 * The raw query value is never rendered.
 */
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "ไม่สามารถเริ่มการเข้าสู่ระบบด้วย SSO ได้ กรุณาลองใหม่อีกครั้ง",
  OAuthCallback: "การเข้าสู่ระบบด้วย SSO ถูกยกเลิกหรือไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
  OAuthAccountNotLinked: "บัญชีนี้ไม่สามารถใช้เข้าสู่ระบบด้วย SSO ได้",
  Callback: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง",
  AccessDenied: "คุณไม่มีสิทธิ์เข้าใช้งานระบบนี้",
  SessionRequired: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
};

export function loginErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return Object.hasOwn(LOGIN_ERROR_MESSAGES, code)
    ? LOGIN_ERROR_MESSAGES[code]
    : SSO_ERROR_MESSAGE;
}
