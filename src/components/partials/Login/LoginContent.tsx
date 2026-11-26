"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  MFA_INVALID_ERROR,
  MFA_LOCKED_ERROR,
  MFA_MESSAGES,
  parseMfaRequired,
} from "@/constant/mfa";
import { ACCESS_DENIED_ERROR, loginErrorMessage } from "@/constant/sso";
import { useAuth } from "@/hooks/auth";
import { consumeReturnPath, readSignedOutMessage } from "@/lib/return-path";
import { LOGIN_ERROR_MESSAGE, writeRememberedUsername } from "./Login.config";
import { LoginForm, type LoginFormValues } from "./LoginForm";
import { LoginHero } from "./LoginHero";
import { LoginOtpForm } from "./LoginOtpForm";

// sessionStorage is only read, never watched — a no-op subscription is enough
const noSubscribe = () => () => {};

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
  /** set once the password was right and an OTP was e-mailed */
  const [mfa, setMfa] = useState<(LoginFormValues & { maskedEmail: string }) | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  // why the last session ended (idle / 8-hour limit) — until the next attempt
  const signedOutMessage = useSyncExternalStore(
    noSubscribe,
    readSignedOutMessage,
    () => null,
  );
  const [attempted, setAttempted] = useState(false);

  const finish = ({ username, remember }: LoginFormValues) => {
    // only a username that actually signed in is worth remembering
    writeRememberedUsername(remember ? username.trim() : null);
    // callbackUrl was validated on the server as an app-relative path, and a
    // remembered page goes through the same check, so neither leaves the site
    router.replace(consumeReturnPath(callbackUrl));
  };

  /** step 1 — the password; a right one e-mails an OTP */
  const handleSubmit = async (values: LoginFormValues) => {
    setAttempted(true);
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signIn("credentials", {
      username: values.username,
      pwd: values.pwd,
      redirect: false,
    });

    setIsSubmitting(false);

    const maskedEmail = parseMfaRequired(result?.error);
    if (maskedEmail !== null) {
      setOtpError(null);
      setMfa({ ...values, maskedEmail });
      return;
    }
    if (!result?.ok) {
      setErrorMessage(
        result?.error === ACCESS_DENIED_ERROR
          ? loginErrorMessage(ACCESS_DENIED_ERROR)
          : LOGIN_ERROR_MESSAGE,
      );
      return;
    }
    // a backend with MFA switched off signs in on the password alone
    finish(values);
  };

  /** step 2 — the e-mailed code */
  const handleOtp = async (otp: string) => {
    if (!mfa) return;
    setIsSubmitting(true);
    setOtpError(null);
    const result = await signIn("credentials", {
      username: mfa.username,
      pwd: mfa.pwd,
      otp,
      redirect: false,
    });
    setIsSubmitting(false);

    if (result?.ok) return finish(mfa);
    if (result?.error === MFA_INVALID_ERROR) {
      setOtpError(MFA_MESSAGES[MFA_INVALID_ERROR]);
      return;
    }
    // locked out, or anything unexpected: start again from the password
    setMfa(null);
    setErrorMessage(
      result?.error === MFA_LOCKED_ERROR
        ? MFA_MESSAGES[MFA_LOCKED_ERROR]
        : LOGIN_ERROR_MESSAGE,
    );
  };

  /** the password step again, which e-mails a fresh code */
  const resendOtp = async () => {
    if (!mfa) return;
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      username: mfa.username,
      pwd: mfa.pwd,
      redirect: false,
    });
    setIsSubmitting(false);
    if (parseMfaRequired(result?.error) !== null) {
      setOtpError(null);
      toast.success("ส่งรหัส OTP ใหม่แล้ว");
    } else {
      toast.error("ส่งรหัส OTP ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
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
          {mfa ? (
            <LoginOtpForm
              maskedEmail={mfa.maskedEmail}
              onSubmit={(otp) => void handleOtp(otp)}
              onResend={() => void resendOtp()}
              onBack={() => setMfa(null)}
              isSubmitting={isSubmitting}
              errorMessage={otpError}
            />
          ) : (
            <LoginForm
              onSubmit={(values) => void handleSubmit(values)}
              isSubmitting={isSubmitting || isSsoLoading}
              errorMessage={errorMessage}
              notice={attempted ? null : signedOutMessage}
              // sign-in with SSO starts only from this click, never on load
              onSso={() => void handleSSOLogin(consumeReturnPath(callbackUrl))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
