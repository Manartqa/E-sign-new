import { getCsrfToken } from "next-auth/react";
import { toast } from "sonner";
import { LOGOUT_URL } from "@/constant/sso";
import { clearSearchPersist } from "@/hooks/common";

/**
 * Sign out of this app *and* the SSO session.
 *
 * The server route revokes the tokens, clears the session cookie and hands the
 * browser to the SSO end-session endpoint, which returns to /login. NextAuth's
 * signOut() is not used — it would leave the IdP session alive.
 *
 * The route only accepts a POST carrying NextAuth's CSRF token, so this
 * submits a real form: a top-level navigation that can follow the redirects.
 */
export async function logoutEverywhere() {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) {
    toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    return;
  }

  // saved filters (search words included) must not carry over to the next user
  clearSearchPersist();

  const form = document.createElement("form");
  form.method = "POST";
  form.action = LOGOUT_URL;
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "csrfToken";
  input.value = csrfToken;
  form.append(input);
  document.body.append(form);
  form.submit();
}
