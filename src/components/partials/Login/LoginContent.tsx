"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ROUTES } from "@/constant/routes";
import { LOGIN_ERROR_MESSAGE } from "./Login.config";
import { LoginForm, type LoginFormValues } from "./LoginForm";
import { LoginHero } from "./LoginHero";

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? ROUTES.applications;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    router.replace(callbackUrl);
  };

  const handleSso = () => {
    // The Figma `login-page-SSO` frame is a screenshot of the external
    // provider — there is nothing to build here until the SSO endpoint exists.
    toast.info("ยังไม่ได้เชื่อมต่อระบบ SSO");
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
