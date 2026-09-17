"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Check, Eye, EyeOff, KeyRound, X } from "lucide-react";
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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-black">
        {label}
      </label>
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-lg border bg-[#f8fafc] px-3 focus-within:border-brand-navy-mid",
          invalid && "border-destructive focus-within:border-destructive",
        )}
      >
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          className="shrink-0 text-muted-foreground"
        >
          {visible ? (
            <EyeOff className="size-[18px]" aria-hidden />
          ) : (
            <Eye className="size-[18px]" aria-hidden />
          )}
        </button>
      </div>
      {children}
    </div>
  );
}

/**
 * Not in Figma — the profile page's เปลี่ยนรหัสผ่าน button had no design, so
 * this follows ReturnForEditModal's header / body / footer layout.
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
        className="w-[480px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
      >
        <form onSubmit={(e) => void handleSubmit(e)}>
          <header className="flex items-center justify-between border-b p-5">
            <div className="flex items-center gap-3">
              <KeyRound className="size-5 text-brand-navy-mid" aria-hidden />
              <DialogTitle className="text-lg font-bold text-brand-navy-mid">
                เปลี่ยนรหัสผ่าน
              </DialogTitle>
            </div>
            <button type="button" onClick={onClose} aria-label="ปิด">
              <X className="size-5 text-muted-foreground" aria-hidden />
            </button>
          </header>

          <div className="flex flex-col gap-5 p-6">
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

            {/* rules sit last, below both new-password fields */}
            <div className="flex flex-col gap-1.5 rounded-lg bg-[#f8fafc] p-3">
              <p className="text-xs font-semibold text-foreground">
                รหัสผ่านใหม่ต้องมี
              </p>
              <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(newPwd);
                  return (
                    <li
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-1.5 text-xs transition-colors",
                        passed ? "text-status-approved-fg" : "text-muted-foreground",
                      )}
                    >
                      <Check
                        className={cn(
                          "size-3.5 shrink-0",
                          passed ? "opacity-100" : "opacity-30",
                        )}
                        aria-hidden
                      />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 bg-[#f8fafc] p-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-navy-mid bg-white px-5 py-2.5 text-xs font-semibold text-brand-navy-mid hover:bg-secondary"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-brand-navy-mid px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-50"
            >
              {changePassword.isPending ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
