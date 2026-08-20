"use client";

import { useId, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldUser,
  User,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  LOGIN_ERROR_MESSAGE,
  PASSWORD_PLACEHOLDER,
  USERNAME_PLACEHOLDER,
} from "./Login.config";

export interface LoginFormValues {
  username: string;
  pwd: string;
  remember: boolean;
}

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
  isSubmitting?: boolean;
  /** null = no error; otherwise the banner message */
  errorMessage?: string | null;
  onSso?: () => void;
}

/**
 * Figma: login-page › login-card (12:54)
 * Input / button / form-error states come from `login-page error` (187:1510).
 */
export function LoginForm({
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
  onSso,
}: LoginFormProps) {
  const usernameId = useId();
  const passwordId = useId();
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(errorMessage);
  const canSubmit = username.trim() !== "" && pwd !== "" && !isSubmitting;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ username, pwd, remember });
  };

  const fieldClass = cn(
    "flex h-12 w-full items-center gap-2.5 rounded-xl border bg-white px-3.5",
    "focus-within:border-2 focus-within:border-brand-navy-mid",
    hasError ? "border-destructive" : "border-border",
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[460px] flex-col gap-6 rounded-3xl bg-white p-8 shadow-[0_20px_30px_rgba(0,0,0,0.1)] sm:p-12"
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase">
          ยินดีต้อนรับ
        </p>
        <h2 className="text-[28px] font-bold text-brand-navy">เข้าสู่ระบบ</h2>
        <p className="text-sm text-muted-foreground">
          กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ
        </p>
      </div>

      {hasError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4"
        >
          <AlertTriangle className="size-[18px] shrink-0 text-destructive" aria-hidden />
          <p className="text-sm font-semibold text-destructive">
            {errorMessage ?? LOGIN_ERROR_MESSAGE}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={usernameId} className="text-sm font-semibold text-[#374151]">
            ชื่อผู้ใช้งาน (Username)
          </label>
          <div className={fieldClass}>
            <User className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
            <input
              id={usernameId}
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={USERNAME_PLACEHOLDER}
              disabled={isSubmitting}
              className="min-w-0 flex-1 bg-transparent text-sm text-brand-navy outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={passwordId} className="text-sm font-semibold text-[#374151]">
            รหัสผ่าน (Password)
          </label>
          <div className={fieldClass}>
            <Lock className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
            <input
              id={passwordId}
              name="pwd"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder={PASSWORD_PLACEHOLDER}
              disabled={isSubmitting}
              className="min-w-0 flex-1 bg-transparent text-sm text-brand-navy outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="shrink-0 text-muted-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-[18px]" aria-hidden />
              ) : (
                <Eye className="size-[18px]" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 text-sm text-[#475569]">
          <Checkbox
            checked={remember}
            onCheckedChange={(checked) => setRemember(checked === true)}
            className="size-[18px] rounded"
          />
          จำข้อมูลเข้าสู่ระบบ
        </label>
        <button
          type="button"
          className="text-sm font-semibold text-brand-navy-mid hover:underline"
        >
          ลืมรหัสผ่าน?
        </button>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl px-4 text-base font-semibold transition-colors",
          canSubmit
            ? "bg-brand-navy-mid text-white hover:bg-brand-navy-hover"
            : "bg-border text-slate-400",
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-[18px] animate-spin" aria-hidden />
            loading...
          </>
        ) : (
          <>
            {hasError ? "ลองอีกครั้ง" : "เข้าสู่ระบบ"}
            <ArrowRight className="size-[18px]" aria-hidden />
          </>
        )}
      </button>

      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-slate-400">หรือ</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={onSso}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-[1.5px] border-brand-navy-mid bg-white px-4 py-3 hover:bg-[#eff6ff]"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff]">
          <ShieldUser className="size-[22px] text-brand-navy-mid" aria-hidden />
        </span>
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-[15px] font-bold text-brand-navy-mid">
            เข้าสู่ระบบด้วย SSO
          </span>
          <span className="text-xs text-slate-400">Single Sign-On (SSO)</span>
        </span>
      </button>
    </form>
  );
}
