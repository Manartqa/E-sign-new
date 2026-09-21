"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Check, Eye, EyeOff, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useChangePassword } from "@/hooks/profile";
import { cn } from "@/lib/utils";
import { PASSWORD_RULES } from "./Profile.config";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  invalid,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
  /** hint or error rendered under the input */
  children?: ReactNode;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-base font-semibold text-foreground">
        {label}
        <span className="ml-1 text-destructive">*</span>
      </label>
      <div
        className={cn(
          "flex h-14 items-center gap-2 rounded-xl border bg-white px-4 focus-within:border-brand-navy-mid",
          invalid && "border-destructive focus-within:border-destructive",
        )}
      >
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          aria-invalid={invalid || undefined}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          className="shrink-0 text-muted-foreground"
        >
          {/* crossed out while the text is hidden */}
          {visible ? (
            <Eye className="size-5" aria-hidden />
          ) : (
            <EyeOff className="size-5" aria-hidden />
          )}
        </button>
      </div>
      {children}
    </div>
  );
}

/**
 * Not in Figma — laid out from the mock-up the user supplied (2026-09-21), in the app's navy:
 * plain title with a close ×, three fields, the rules box, then the buttons.
 * Mount it only while open so every visit starts with empty fields.
 */
export function ChangePasswordModal({
  open,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const changePassword = useChangePassword();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rulesPassed = PASSWORD_RULES.every((rule) => rule.test(newPwd));
  const sameAsCurrent = newPwd !== "" && newPwd === currentPwd;
  const mismatch = confirmPwd !== "" && confirmPwd !== newPwd;
  const canSubmit =
    currentPwd !== "" &&
    rulesPassed &&
    !sameAsCurrent &&
    confirmPwd === newPwd &&
    !changePassword.isPending;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await changePassword.mutateAsync({ currentPwd, newPwd });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[560px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
      >
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6 p-6">
          <header className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl font-bold text-foreground">
              เปลี่ยนรหัสผ่าน
            </DialogTitle>
            <button type="button" onClick={onClose} aria-label="ปิด">
              <X className="size-6 text-muted-foreground" aria-hidden />
            </button>
          </header>

          <div className="flex flex-col gap-6">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3"
              >
                <AlertTriangle
                  className="size-4 shrink-0 text-destructive"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-destructive">{error}</p>
              </div>
            )}

            <PasswordField
              label="รหัสผ่านปัจจุบัน"
              value={currentPwd}
              onChange={(value) => {
                setCurrentPwd(value);
                setError(null);
              }}
              autoComplete="current-password"
            />

            <PasswordField
              label="รหัสผ่านใหม่"
              value={newPwd}
              onChange={setNewPwd}
              autoComplete="new-password"
              invalid={sameAsCurrent}
            >
              {sameAsCurrent && (
                <p className="text-xs text-destructive">
                  รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน
                </p>
              )}
            </PasswordField>

            <PasswordField
              label="ยืนยันรหัสผ่านใหม่"
              value={confirmPwd}
              onChange={setConfirmPwd}
              autoComplete="new-password"
              invalid={mismatch}
            >
              {mismatch && (
                <p className="text-xs text-destructive">
                  รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านใหม่
                </p>
              )}
            </PasswordField>

            {/* rules sit last, below both new-password fields; each ticks
                green as the new password meets it */}
            <div className="flex flex-col gap-2 rounded-xl border bg-[#f8fafc] p-4">
              <p className="text-sm font-medium text-foreground">ข้อกำหนดรหัสผ่าน</p>
              <ul className="flex flex-col gap-1.5">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(newPwd);
                  return (
                    <li
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-2 text-sm transition-colors",
                        passed ? "text-status-approved-fg" : "text-slate-400",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full",
                          passed ? "bg-status-approved-bg" : "bg-slate-200",
                        )}
                      >
                        <Check className="size-3.5" aria-hidden />
                      </span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border bg-white px-5 py-3 text-base font-semibold text-foreground hover:bg-secondary"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-brand-navy-mid px-6 py-3 text-base font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-50"
            >
              {changePassword.isPending ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
