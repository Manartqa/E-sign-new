import { LOGOUT_URL } from "@/constant/sso";
import { clearSearchPersist } from "@/hooks/common";

/**
 * Sign out of this app *and* the SSO session.
 *
 * The server route revokes the tokens, clears the session cookie and hands the
 * browser to the SSO end-session endpoint, which returns to /login. NextAuth's
 * signOut() is not used — it would leave the IdP session alive.
 */
export function logoutEverywhere() {
  // saved filters (search words included) must not carry over to the next user
  clearSearchPersist();
  window.location.href = LOGOUT_URL;
}
