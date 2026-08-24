"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ROUTES } from "@/constant/routes";
import { IS_SSO_ENABLED, SSO_ERROR_MESSAGE, SSO_PROVIDER_ID } from "@/constant/sso";
import { LOGIN_ERROR_MESSAGE } from "./Login.config";
import { LoginForm, type LoginFormValues } from "./LoginForm";
import { LoginHero } from "./LoginHero";

interface LoginContentProps {
  /** true when NextAuth redirected back here with `?error=` from the SSO flow */
  hasSsoError?: boolean;
}

export default function LoginContent({ hasSsoError = false }: LoginContentProps) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    hasSsoError ? SSO_ERROR_MESSAGE : null,
  );

  const handleSubmit = async ({ username, pwd }: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signIn("credentials", {
      username,
      pwd,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result?.ok) {
      setErrorMessage(LOGIN_ERROR_MESSAGE);
      return;
    }
    // Always land on the application list. The proxy appends a `callbackUrl`
    // when it bounces an unauthenticated request, but that value is
    // attacker-controllable (/login?callbackUrl=https://evil.com), so it is
    // deliberately ignored rather than passed to router.replace.
    router.replace(ROUTES.applications);
  };

  const handleSso = () => {
    if (!IS_SSO_ENABLED) {
      // no client_id registered for this environment yet
      toast.info("ยังไม่ได้เชื่อมต่อระบบ SSO");
      return;
    }
    // Full-page redirect into the SSO Auth Server's Authorization Code flow;
    // NextAuth handles state/nonce/PKCE and the /api/auth/callback/sso return.
    setIsSubmitting(true);
    void signIn(SSO_PROVIDER_ID, { callbackUrl: ROUTES.applications });
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <LoginHero variant="compact" className="lg:hidden" />
      <LoginHero className="hidden w-[55%] shrink-0 lg:flex" />

      <div className="flex flex-1 items-center justify-center bg-[#fafafa] px-4 py-10 sm:px-16 sm:py-14">
        <LoginForm
          onSubmit={(values) => void handleSubmit(values)}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onSso={handleSso}
        />
      </div>
    </div>
  );
}
