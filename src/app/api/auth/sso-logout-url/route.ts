import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { SSO_PROVIDER_ID, buildSsoLogoutUrl } from "@/lib/sso";

/**
 * The RP-initiated logout URL for the current session, or `{ url: null }`
 * when this session did not come from SSO.
 *
 * Read *before* NextAuth's signOut clears the cookie — the `id_token_hint`
 * lives in that cookie, so the order matters (see `logoutEverywhere`).
 */
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token || token.provider !== SSO_PROVIDER_ID) {
    return NextResponse.json({ url: null });
  }

  const origin = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;

  try {
    const url = await buildSsoLogoutUrl(token.idToken, `${origin}/login`);
    return NextResponse.json({ url });
  } catch {
    // SSO unreachable — the local session is still cleared by the caller
    return NextResponse.json({ url: null });
  }
}
