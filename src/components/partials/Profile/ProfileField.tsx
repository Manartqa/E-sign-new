"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

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
}

/**
 * Figma: app-Profile › read-only field (116:1861 and friends).
 * Every field on this page is display-only — editing happens behind the
 * แก้ไขข้อมูล button, which has no designed screen yet.
 */
export function ProfileField({
  label,
  required,
  icon,
  value,
  maskedValue,
  copyable,
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

      <div className="flex items-center justify-between gap-2 rounded-lg border bg-[#f8fafc] px-3 py-2.5">
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
    </div>
  );
}
