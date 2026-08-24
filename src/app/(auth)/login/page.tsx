import { LoginContent } from "@/components/partials/Login";

export const metadata = { title: "เข้าสู่ระบบ" };

/**
 * NextAuth bounces a failed SSO round-trip back here as `/login?error=...`
 * (OAuthCallback, AccessDenied, Configuration…). The code itself is internal,
 * so only the fact that one is present is handed to the client.
 */
export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  // Next 16: searchParams is always a Promise
  const { error } = await searchParams;
  return <LoginContent hasSsoError={Boolean(error)} />;
}
