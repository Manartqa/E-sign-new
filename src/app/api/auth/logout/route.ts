import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { SESSION_COOKIE_NAME, clearSessionCookie } from "@/lib/session-cookie";
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
export async function GET(request: NextRequest) {
  // Ending the SSO session logs the user out of every app on it — refuse a
  // cross-site trigger such as <img src=".../api/auth/logout">.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
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

  const response = NextResponse.redirect(location, 302);
  response.headers.set("Cache-Control", "no-store");
  return clearSessionCookie(response);
}
