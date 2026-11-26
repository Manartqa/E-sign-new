import { safeCallbackUrl } from "@/lib/callback-url";
import { ROUTES } from "@/constant/routes";
import { PUBLIC_BASE_PATH } from "@/constant/sso";

/**
 * Where to go after the next sign-in, and why the last session ended — kept
 * in sessionStorage across the sign-out redirect, so an officer signed out
 * for idling lands back on the page they were on (this tab only).
 */
const RETURN_PATH_KEY = "return-after-login";
const SIGNED_OUT_REASON_KEY = "signed-out-reason";

export const SIGNED_OUT_REASONS = {
  IDLE: "ระบบออกจากระบบให้อัตโนมัติ เนื่องจากไม่มีการใช้งานเกิน 1 ชั่วโมง กรุณาเข้าสู่ระบบอีกครั้ง",
  EXPIRED: "เซสชันหมดอายุ (ใช้งานต่อเนื่องครบ 8 ชั่วโมง) กรุณาเข้าสู่ระบบอีกครั้ง",
} as const;
export type SignedOutReason = keyof typeof SIGNED_OUT_REASONS;

/** this page as an app-relative path (basePath dropped), like callbackUrl */
export function currentAppPath(): string {
  const { pathname, search } = window.location;
  const path =
    PUBLIC_BASE_PATH && pathname.startsWith(PUBLIC_BASE_PATH)
      ? pathname.slice(PUBLIC_BASE_PATH.length) || "/"
      : pathname;
  return path + search;
}

export function rememberSignOut(path: string, reason: SignedOutReason) {
  try {
    window.sessionStorage.setItem(RETURN_PATH_KEY, path);
    window.sessionStorage.setItem(SIGNED_OUT_REASON_KEY, reason);
  } catch {
    // storage blocked — the sign-out still happens, it just won't return here
  }
}

/** the message for the login page, or null; read-only (no clearing during render) */
export function readSignedOutMessage(): string | null {
  try {
    const reason = window.sessionStorage.getItem(SIGNED_OUT_REASON_KEY);
    return reason && reason in SIGNED_OUT_REASONS
      ? SIGNED_OUT_REASONS[reason as SignedOutReason]
      : null;
  } catch {
    return null;
  }
}

/**
 * The page to open after signing in: `callbackUrl` when the URL named one,
 * else the remembered page, else the default. Clears what was remembered.
 */
export function consumeReturnPath(callbackUrl: string): string {
  let stored: string | null = null;
  try {
    stored = window.sessionStorage.getItem(RETURN_PATH_KEY);
    window.sessionStorage.removeItem(RETURN_PATH_KEY);
    window.sessionStorage.removeItem(SIGNED_OUT_REASON_KEY);
  } catch {
    // storage blocked
  }
  if (callbackUrl !== ROUTES.applications || !stored) return callbackUrl;
  return safeCallbackUrl(stored);
}
