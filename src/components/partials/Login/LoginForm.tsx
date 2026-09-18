"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  LOGIN_ERROR_MESSAGE,
  PASSWORD_PLACEHOLDER,
  USERNAME_PLACEHOLDER,
  readRememberedUsername,
} from "./Login.config";

// storage is only read, never watched — a no-op subscription is enough
const noSubscribe = () => () => {};

/**
 * Not in Figma: the card's rows rise in one after another, starting just as
 * the card itself (LoginContent, delay 200ms) has begun to land.
 */
const RISE =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-400 motion-reduce:animate-none";
const riseDelay = (step: number) => ({ animationDelay: `${300 + step * 70}ms` });

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
  // the server renders "" and the client swaps in the remembered username
  // without a hydration mismatch; null = the user hasn't touched the field yet
  const rememberedUsername = useSyncExternalStore(
    noSubscribe,
    readRememberedUsername,
    () => "",
  );
  const [typedUsername, setUsername] = useState<string | null>(null);
  const [pwd, setPwd] = useState("");
  const [rememberChoice, setRemember] = useState<boolean | null>(null);
  const username = typedUsername ?? rememberedUsername;
  const remember = rememberChoice ?? rememberedUsername !== "";
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(errorMessage);
  const canSubmit = username.trim() !== "" && pwd !== "" && !isSubmitting;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ username, pwd, remember });
  };

  const fieldClass = cn(
    "group/field flex h-11 w-full sm:h-12 items-center gap-2.5 rounded-xl border bg-white px-3.5",
    "focus-within:border-2 focus-within:border-brand-navy-mid",
    // not in Figma: a soft halo eases in around the focused field
    "transition-shadow duration-200 focus-within:ring-4 focus-within:ring-brand-navy-mid/10",
    hasError ? "border-destructive" : "border-border",
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[460px] flex-col gap-4 rounded-3xl bg-white p-6 shadow-[0_20px_30px_rgba(0,0,0,0.1)] sm:gap-6 sm:p-12"
    >
      <div className={cn("flex flex-col gap-2", RISE)} style={riseDelay(0)}>
        <p className="text-xs font-semibold text-muted-foreground uppercase max-sm:hidden">
          ยินดีต้อนรับ
        </p>
        <h2 className="text-2xl font-bold text-brand-navy sm:text-[28px]">เข้าสู่ระบบ</h2>
        <p className="text-sm text-muted-foreground">
          กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ
        </p>
      </div>

      {hasError && (
        <div
          role="alert"
          // not in Figma: shakes each time it appears — LoginContent clears the
          // message on submit, so every failed attempt remounts it
          className="flex animate-shake items-center gap-2.5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 motion-reduce:animate-none"
        >
          <AlertTriangle className="size-[18px] shrink-0 text-destructive" aria-hidden />
          <p className="text-sm font-semibold text-destructive">
            {errorMessage ?? LOGIN_ERROR_MESSAGE}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:gap-5">
        <div className={cn("flex flex-col gap-1.5", RISE)} style={riseDelay(1)}>
          <label htmlFor={usernameId} className="text-sm font-semibold text-[#374151]">
            ชื่อผู้ใช้งาน (Username)
          </label>
          <div className={fieldClass}>
            <User className="size-[18px] shrink-0 text-muted-foreground transition-colors group-focus-within/field:text-brand-navy-mid" aria-hidden />
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

        <div className={cn("flex flex-col gap-1.5", RISE)} style={riseDelay(2)}>
          <label htmlFor={passwordId} className="text-sm font-semibold text-[#374151]">
            รหัสผ่าน (Password)
          </label>
          <div className={fieldClass}>
            <Lock className="size-[18px] shrink-0 text-muted-foreground transition-colors group-focus-within/field:text-brand-navy-mid" aria-hidden />
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

      <div
        className={cn("flex items-center justify-between", RISE)}
        style={riseDelay(3)}
      >
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
        style={riseDelay(4)}
        className={cn(
          "group flex h-11 w-full items-center sm:h-12 justify-center gap-2.5 rounded-2xl px-4 text-base font-semibold transition-[background-color,color,box-shadow,translate] duration-200",
          RISE,
          // not in Figma: once enabled, the button lifts on hover and its
          // arrow nudges forward
          canSubmit
            ? "bg-brand-navy-mid text-white hover:bg-brand-navy-hover hover:shadow-lg motion-safe:hover:-translate-y-0.5"
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
            <ArrowRight
              className="size-[18px] transition-transform duration-200 motion-safe:group-enabled:group-hover:translate-x-1"
              aria-hidden
            />
          </>
        )}
      </button>

      <div className={cn("flex items-center gap-4", RISE)} style={riseDelay(5)}>
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-slate-400">หรือ</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={onSso}
        style={riseDelay(6)}
        className={cn(
          "flex w-full items-center justify-center gap-3 rounded-2xl border-[1.5px] border-brand-navy-mid bg-white px-4 py-2 sm:py-3 transition-[background-color,box-shadow,translate] duration-200 hover:bg-[#eff6ff] hover:shadow-md motion-safe:hover:-translate-y-0.5",
          RISE,
        )}
      >
        {/* the SSO mark itself, cropped from the logo the user supplied */}
        <Image
          src="/brand/sso-mark.png"
          alt=""
          width={256}
          height={256}
          className="size-10 shrink-0"
          aria-hidden
        />
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
