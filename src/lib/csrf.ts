import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Check a submitted CSRF token against NextAuth's double-submit cookie
 * (`token|sha256(token + secret)`), the same way NextAuth checks its own
 * POSTs. The cookie is SameSite=Lax and httpOnly, so a cross-site form can
 * neither send it nor read the token out of it.
 */
export function isValidCsrfToken(
  cookieValue: string | undefined,
  submitted: unknown,
  secret: string | undefined,
): boolean {
  if (!cookieValue || !secret || typeof submitted !== "string" || !submitted) {
    return false;
  }
  const [token, hash] = cookieValue.split("|");
  if (!token || !hash) return false;

  const expected = createHash("sha256").update(`${token}${secret}`).digest("hex");
  return safeEqual(hash, expected) && safeEqual(submitted, token);
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
