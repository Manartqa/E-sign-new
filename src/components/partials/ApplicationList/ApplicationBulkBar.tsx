"use client";

import { X } from "lucide-react";
import { ActionButton } from "@/components/common";
import type { ActionMode } from "@/types/app/applications";

interface ApplicationBulkBarProps {
  count: number;
  isSubmitting: boolean;
  onAction: (action: ActionMode) => void;
  onClear: () => void;
}

/**
 * Batch action bar above the table.
 *
 * The Figma file has no bulk design, so the three ActionButton variants from
 * the detail page (68:628) are reused as-is. It only appears from two
 * selected rows up — a single row is handled on its own detail page.
 */
export function ApplicationBulkBar({
  count,
  isSubmitting,
  onAction,
  onClear,
}: ApplicationBulkBarProps) {
  if (count < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-5 py-3">
      <span className="text-sm font-semibold text-brand-navy-mid">
        เลือกแล้ว {count} รายการ
      </span>
      <button
        type="button"
        onClick={onClear}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-navy-mid"
      >
        <X className="size-3.5" aria-hidden />
        ล้างการเลือก
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        <ActionButton
          action="return"
          disabled={isSubmitting}
          onClick={() => onAction("return")}
        />
        <ActionButton
          action="reject"
          disabled={isSubmitting}
          onClick={() => onAction("reject")}
        />
        <ActionButton
          action="approve"
          disabled={isSubmitting}
          onClick={() => onAction("approve")}
        />
      </div>
    </div>
  );
}
