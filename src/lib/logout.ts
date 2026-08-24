import { signOut } from "next-auth/react";
import { ROUTES } from "@/constant/routes";

/**
 * Sign out of this app *and* the SSO browser session.
 *
 * Order matters: the id_token used as `id_token_hint` lives in the NextAuth
 * cookie, so the logout URL is fetched first, the local session is cleared
 * second, and only then is the browser handed to the SSO server. A
 * credentials (mock) session gets `url: null` and just lands on /login.
 */
export async function logoutEverywhere() {
  let ssoLogoutUrl: string | null = null;

  try {
    const res = await fetch("/api/auth/sso-logout-url");
    if (res.ok) ({ url: ssoLogoutUrl } = await res.json());
  } catch {
    // offline or SSO down — fall through to the local sign-out
  }

  await signOut({ redirect: false });
  window.location.href = ssoLogoutUrl ?? ROUTES.login;
}
