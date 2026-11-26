/**
 * Session limits (user's call, 2026-11-26). Legacy SSPF: 5 minutes idle with
 * no warning, 8 hours absolute.
 */

/** signed out after this long with no activity in any tab (user's call, 2026-11-26: 1 hour) */
export const IDLE_TIMEOUT_MS = 60 * 60_000;

/** the warning dialog opens this long before the idle sign-out */
export const IDLE_WARNING_MS = 2 * 60_000;

/** a session ends this long after sign-in, however active */
export const SESSION_ABSOLUTE_MS = 8 * 60 * 60_000;

/** token `error` once the absolute limit has passed */
export const SESSION_EXPIRED_ERROR = "SessionExpired";

/** whether a session signed in at `signedInAt` is past the absolute limit */
export function isPastAbsoluteLimit(
  signedInAt: unknown,
  now = Date.now(),
): boolean {
  return typeof signedInAt === "number" && now - signedInAt > SESSION_ABSOLUTE_MS;
}
