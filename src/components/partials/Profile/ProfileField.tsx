"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileFieldProps {
  label: string;
  required?: boolean;
  /** shown before the label, e.g. a mail or phone icon */
  icon?: ReactNode;
  /** the real value */
  value: string;
  /** when set, the field starts masked and an eye toggle reveals it */
  maskedValue?: string;
  /** renders a copy-to-clipboard button instead of the eye */
  copyable?: boolean;
  /** renders an input (or, with `options`, a select) instead of static text */
  editable?: boolean;
  onChange?: (value: string) => void;
  /** paired with `editable` to render a <select> instead of a text input */
  options?: readonly string[];
}

/**
 * Figma: app-Profile › read-only field (116:1861 and friends).
 * `editable` swaps the static display for a real input/select, driven by
 * the แก้ไขข้อมูล toggle in ProfileContent — every field takes it except
 * อีเมล, which stays display-only there regardless of edit mode.
 */
export function ProfileField({
  label,
  required,
  icon,
  value,
  maskedValue,
  copyable,
  editable,
  onChange,
  options,
}: ProfileFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const shown = maskedValue && !revealed ? maskedValue : value;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("คัดลอกไม่สำเร็จ");
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1 text-[13px]">
        {icon}
        <span className="text-[#374151]">{label}</span>
        {required && <span className="text-destructive">*</span>}
      </div>

      {editable ? (
        options ? (
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            aria-label={label}
            className="rounded-lg border bg-white px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-brand-navy-mid"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            aria-label={label}
            className="rounded-lg border bg-white px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-brand-navy-mid"
          />
        )
      ) : (
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5",
            "bg-[#f8fafc]",
          )}
        >
          <span className="min-w-0 truncate text-[13px] text-foreground">
            {shown}
          </span>

          {maskedValue && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? `ซ่อน${label}` : `แสดง${label}`}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {revealed ? (
                <EyeOff className="size-3.5" aria-hidden />
              ) : (
                <Eye className="size-3.5" aria-hidden />
              )}
            </button>
          )}

          {copyable && (
            <button
              type="button"
              onClick={() => void handleCopy()}
              aria-label={`คัดลอก${label}`}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <Check className="size-3.5 text-action-approve" aria-hidden />
              ) : (
                <Copy className="size-3.5" aria-hidden />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
