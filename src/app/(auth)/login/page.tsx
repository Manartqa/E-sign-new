import { LoginContent } from "@/components/partials/Login";
import { loginErrorMessage } from "@/constant/sso";
import { safeCallbackUrl } from "@/lib/callback-url";

export const metadata = { title: "เข้าสู่ระบบ" };

/**
 * NextAuth bounces a failed sign-in back here as `/login?error=<code>`; the
 * proxy sends a guest here with `?callbackUrl=<app path>`. Both are resolved
 * on the server — the code into a fixed Thai message, the callback into a
 * validated app-relative path — so no raw query value reaches the page.
 */
export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  // Next 16: searchParams is always a Promise
  const { error, callbackUrl } = await searchParams;
  return (
    <LoginContent
      errorMessage={loginErrorMessage(typeof error === "string" ? error : undefined)}
      callbackUrl={safeCallbackUrl(callbackUrl)}
    />
  );
}
