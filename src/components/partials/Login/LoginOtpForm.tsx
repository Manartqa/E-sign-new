"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertTriangle, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { OTP_LENGTH } from "@/constant/mfa";
import { cn } from "@/lib/utils";

interface LoginOtpFormProps {
  /** where the code went, e.g. "m*******a@smartalliance.co.th" */
  maskedEmail: string;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

/**
 * Not in Figma: the second step of a password sign-in — the one-time code
 * e-mailed to the account (constant/mfa). Same card as LoginForm.
 */
export function LoginOtpForm({
  maskedEmail,
  onSubmit,
  onResend,
  onBack,
  isSubmitting = false,
  errorMessage = null,
}: LoginOtpFormProps) {
  const otpId = useId();
  const [otp, setOtp] = useState("");
  const canSubmit = otp.length === OTP_LENGTH && !isSubmitting;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) onSubmit(otp);
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-[460px] flex-col gap-5 rounded-3xl bg-white p-6 shadow-[0_20px_30px_rgba(0,0,0,0.1)] sm:gap-6 sm:p-12"
    >
      <div className="flex flex-col gap-2">
        <MailCheck className="size-8 text-brand-navy-mid" aria-hidden />
        <h2 className="text-2xl font-bold text-brand-navy sm:text-[28px]">ยืนยันตัวตน</h2>
        <p className="text-sm text-muted-foreground">
          ระบบได้ส่งรหัส OTP {OTP_LENGTH} หลักไปที่อีเมล{" "}
          <span className="font-semibold text-foreground">{maskedEmail}</span>{" "}
          กรุณากรอกรหัสเพื่อเข้าสู่ระบบ
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex animate-shake items-center gap-2.5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 motion-reduce:animate-none"
        >
          <AlertTriangle className="size-[18px] shrink-0 text-destructive" aria-hidden />
          <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={otpId} className="text-sm font-semibold text-[#374151]">
          รหัส OTP
        </label>
        <input
          id={otpId}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          disabled={isSubmitting}
          className={cn(
            "h-12 w-full rounded-xl border bg-white px-3.5 text-center font-mono text-xl tracking-[0.5em] text-brand-navy outline-none",
            "focus:border-2 focus:border-brand-navy-mid",
            errorMessage ? "border-destructive" : "border-border",
          )}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-navy-mid text-sm font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
        ยืนยันรหัส OTP
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1 text-muted-foreground hover:text-brand-navy-mid"
        >
          <ArrowLeft className="size-4" aria-hidden />
          กลับไปหน้าเข้าสู่ระบบ
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={isSubmitting}
          className="font-semibold text-brand-navy-mid hover:underline"
        >
          ส่งรหัสใหม่
        </button>
      </div>
    </form>
  );
}
