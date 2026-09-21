"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/hooks/auth";
import { LOGIN_ERROR_MESSAGE, writeRememberedUsername } from "./Login.config";
import { LoginForm, type LoginFormValues } from "./LoginForm";
import { LoginHero } from "./LoginHero";

interface LoginContentProps {
  /** fixed Thai text mapped from NextAuth's `?error=` code, or null */
  errorMessage?: string | null;
  /** already validated app-relative path (see safeCallbackUrl) */
  callbackUrl: string;
}

export default function LoginContent({
  errorMessage: initialError = null,
  callbackUrl,
}: LoginContentProps) {
  const router = useRouter();
  const { loading: isSsoLoading, handleSSOLogin } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);

  const handleSubmit = async ({ username, pwd, remember }: LoginFormValues) => {
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
    // only a username that actually signed in is worth remembering
    writeRememberedUsername(remember ? username.trim() : null);
    // callbackUrl was validated on the server as an app-relative path, so it
    // cannot send the user off-site
    router.replace(callbackUrl);
  };

  return (
    // dvh, not vh: on a phone 100vh includes the strip under the browser's
    // address bar, which would push the card's bottom off the visible screen
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* stacked (below lg) the hero takes any spare height on a tall phone,
          so the card sits right under it and ends at the bottom of the screen
          instead of leaving an empty band either above or below it */}
      <LoginHero variant="compact" className="flex-1 lg:hidden" />
      <LoginHero className="hidden w-[55%] shrink-0 lg:flex" />

      <div className="flex items-center justify-center bg-[#fafafa] px-4 pt-4 pb-4 sm:px-16 sm:py-14 lg:flex-1">
        {/* not in Figma: the form rises in just behind the hero's title */}
        <div className="flex w-full animate-in justify-center fill-mode-both delay-200 duration-500 fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
          <LoginForm
            onSubmit={(values) => void handleSubmit(values)}
            isSubmitting={isSubmitting || isSsoLoading}
            errorMessage={errorMessage}
            // sign-in with SSO starts only from this click, never on load
            onSso={() => void handleSSOLogin(callbackUrl)}
          />
        </div>
      </div>
    </div>
  );
}
