import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROUTES } from "@/constant/routes";
import {
  BASE_PATH,
  LOGOUT_MARKER_COOKIE,
  SESSION_COOKIE_NAME,
  clearSessionCookie,
} from "@/lib/session-cookie";

/** Reachable without a session. */
const PUBLIC_PATHS: string[] = [ROUTES.login];

const LANDING = ROUTES.applications;

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/** Redirect to an app-relative path, adding the basePath back. */
function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(`${BASE_PATH}${path}`, request.url));
}

export async function proxy(request: NextRequest) {
  let path = request.nextUrl.pathname;
  if (BASE_PATH && (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`))) {
    path = path.slice(BASE_PATH.length) || "/";
  }

  const isAuthRoute = path === "/api/auth" || path.startsWith("/api/auth/");
  // NextAuth's own routes (signin, callback, csrf, …) never need the token —
  // only /session does, below
  if (isAuthRoute && path !== "/api/auth/session") {
    return noStore(NextResponse.next());
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE_NAME,
  });

  // A request in flight during logout can write the session cookie back after
  // logout cleared it. Such a token predates the logout marker: it is dead,
  // and every response here drops it again.
  const loggedOutAt = Number(request.cookies.get(LOGOUT_MARKER_COOKIE)?.value) || 0;
  const isLoggedOut =
    Boolean(token) && loggedOutAt > 0 && (token?.signedInAt ?? 0) <= loggedOutAt;
  const finish = (response: NextResponse) =>
    noStore(isLoggedOut ? clearSessionCookie(response) : response);

  if (isAuthRoute) {
    // /api/auth/session: report "no session" instead of re-issuing the cookie
    return finish(isLoggedOut ? NextResponse.json({}) : NextResponse.next());
  }

  const liveToken = isLoggedOut ? null : token;
  const isSignedIn = Boolean(liveToken && !liveToken.error);

  if (PUBLIC_PATHS.includes(path)) {
    // an ?error= from NextAuth must stay visible even with a cookie present
    if (isSignedIn && !request.nextUrl.searchParams.has("error")) {
      return finish(redirectTo(request, LANDING));
    }
    return finish(NextResponse.next());
  }

  if (path === "/") {
    return finish(redirectTo(request, isSignedIn ? LANDING : ROUTES.login));
  }

  if (!liveToken) {
    const login = new URL(`${BASE_PATH}${ROUTES.login}`, request.url);
    login.searchParams.set("callbackUrl", `${path}${request.nextUrl.search}`);
    return finish(NextResponse.redirect(login));
  }

  if (liveToken.error === "RefreshAccessTokenError") {
    // drop the dead cookie too, or /login would bounce back here in a loop
    return noStore(clearSessionCookie(redirectTo(request, ROUTES.login)));
  }

  return finish(NextResponse.next());
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|css|js|map|txt|woff2?|pdf)$).*)",
  ],
};
