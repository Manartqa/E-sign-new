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
export function logoutEverywhere() {
  return postLogout({});
}

/**
 * Sign out of this app only, leaving the SSO session alive — for a session
 * that ended on its own (idle timeout, 8-hour limit), not for ออกจากระบบ.
 */
export function logoutApp() {
  return postLogout({ scope: "app" });
}

async function postLogout(fields: Record<string, string>) {
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
  for (const [name, value] of Object.entries({ ...fields, csrfToken })) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);
  form.submit();
}
