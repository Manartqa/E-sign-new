"use client";

import { Check, RotateCcw, X } from "lucide-react";
import type { ComponentProps } from "react";
import type { ActionMode } from "@/types/app/applications";
import { cn } from "@/lib/utils";

const ACTION_CONFIG = {
  approve: {
    label: "อนุมัติและลงนาม",
    Icon: Check,
    className: "bg-action-approve text-white border-transparent",
  },
  reject: {
    label: "ปฏิเสธคำขอ",
    Icon: X,
    className: "border-action-reject text-action-reject",
  },
  return: {
    label: "ส่งคืนเพื่อแก้ไข",
    Icon: RotateCcw,
    className: "border-action-return text-action-return",
  },
} as const satisfies Record<ActionMode, unknown>;

interface ActionButtonProps extends ComponentProps<"button"> {
  action: ActionMode;
}

/** Figma: 🧩 Components › Button/Action (3 variants) — node 68:628 */
export function ActionButton({
  action,
  className,
  ...props
}: ActionButtonProps) {
  const { label, Icon, className: variantClassName } = ACTION_CONFIG[action];

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg border p-3 text-xs font-bold",
        "transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-50",
        variantClassName,
        className,
      )}
      {...props}
    >
      <Icon className="size-[18px]" aria-hidden />
      {label}
    </button>
  );
}
