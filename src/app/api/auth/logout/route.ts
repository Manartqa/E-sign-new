import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isValidCsrfToken } from "@/lib/csrf";
import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  setLogoutMarker,
} from "@/lib/session-cookie";
import {
  SSO_PROVIDER_ID,
  decodeJwtPayload,
  loginUrl,
  revokeTokens,
  ssoEndpoints,
} from "@/lib/sso";

/**
 * Full logout: revoke the SSO tokens, end the SSO session, clear the cookie.
 *
 * Deliberately not NextAuth's signOut() — that only drops the local cookie and
 * leaves the IdP session and tokens alive, so the next "SSO" click would sign
 * the user straight back in.
 */
export async function POST(request: NextRequest) {
  // Ending the SSO session logs the user out of every app on it, so a
  // cross-site page must not be able to trigger it: POST only (GET is 405),
  // and the form must carry NextAuth's CSRF token. Unlike Sec-Fetch-Site this
  // also holds on plain-HTTP origins, where browsers omit Sec-Fetch-* headers.
  const form = await request.formData().catch(() => null);
  if (
    !isValidCsrfToken(
      request.cookies.get(CSRF_COOKIE_NAME)?.value,
      form?.get("csrfToken"),
      process.env.NEXTAUTH_SECRET,
    )
  ) {
    return new NextResponse(null, { status: 403 });
  }

  const target = loginUrl(request.nextUrl.origin);
  let location = target;

  // the raw JWT is the only place the refresh token is reachable
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE_NAME,
  });

  if (token?.provider === SSO_PROVIDER_ID) {
    await revokeTokens(token);

    // the IdP rejects an expired id_token_hint — then just go to the login page
    const exp = token.idToken ? decodeJwtPayload(token.idToken)?.exp : undefined;
    if (token.idToken && typeof exp === "number" && exp * 1000 > Date.now()) {
      location =
        `${ssoEndpoints.endSession}` +
        `?post_logout_redirect_uri=${encodeURIComponent(target)}` +
        `&id_token_hint=${encodeURIComponent(token.idToken)}`;
    }
  }

  // 303: the browser follows with a GET, as the IdP's end-session expects
  const response = NextResponse.redirect(location, 303);
  response.headers.set("Cache-Control", "no-store");
  // the marker outlives a session cookie written back by an in-flight request
  return setLogoutMarker(clearSessionCookie(response));
}
