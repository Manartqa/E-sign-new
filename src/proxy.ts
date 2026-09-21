import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROUTES } from "@/constant/routes";
import {
  BASE_PATH,
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
  return noStore(NextResponse.redirect(new URL(`${BASE_PATH}${path}`, request.url)));
}

export async function proxy(request: NextRequest) {
  let path = request.nextUrl.pathname;
  if (BASE_PATH && (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`))) {
    path = path.slice(BASE_PATH.length) || "/";
  }

  // NextAuth's own routes (signin, callback, session, csrf, logout, …)
  if (path === "/api/auth" || path.startsWith("/api/auth/")) {
    return noStore(NextResponse.next());
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: SESSION_COOKIE_NAME,
  });
  const isSignedIn = Boolean(token && !token.error);

  if (PUBLIC_PATHS.includes(path)) {
    // an ?error= from NextAuth must stay visible even with a cookie present
    if (isSignedIn && !request.nextUrl.searchParams.has("error")) {
      return redirectTo(request, LANDING);
    }
    return noStore(NextResponse.next());
  }

  if (path === "/") {
    return redirectTo(request, isSignedIn ? LANDING : ROUTES.login);
  }

  if (!token) {
    const login = new URL(`${BASE_PATH}${ROUTES.login}`, request.url);
    login.searchParams.set("callbackUrl", `${path}${request.nextUrl.search}`);
    return noStore(NextResponse.redirect(login));
  }

  if (token.error === "RefreshAccessTokenError") {
    // drop the dead cookie too, or /login would bounce back here in a loop
    return clearSessionCookie(redirectTo(request, ROUTES.login));
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|css|js|map|txt|woff2?|pdf)$).*)",
  ],
};
