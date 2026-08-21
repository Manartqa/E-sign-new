"use client";

import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { ActionMode } from "@/types/app/applications";
import { cn } from "@/lib/utils";

const CONFIRM_COPY = {
  approve: {
    title: "อนุมัติและลงนามหลายรายการ",
    verb: "อนุมัติและลงนาม",
    Icon: CheckCircle2,
    accent: "text-action-approve",
    confirmClassName: "bg-action-approve text-white",
  },
  reject: {
    title: "ปฏิเสธคำขอหลายรายการ",
    verb: "ปฏิเสธ",
    Icon: XCircle,
    accent: "text-action-reject",
    confirmClassName: "bg-action-reject text-white",
  },
  return: {
    title: "ส่งคืนเพื่อแก้ไขหลายรายการ",
    verb: "ส่งคืนเพื่อแก้ไข",
    Icon: RotateCcw,
    accent: "text-action-return",
    confirmClassName: "bg-action-return text-white",
  },
} as const satisfies Record<ActionMode, unknown>;

interface BulkConfirmModalProps {
  action: ActionMode | null;
  count: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation step for a batch action. The single-request flow collects a
 * reason in ReturnForEditModal; a batch cannot ask per request, so this only
 * confirms the count and sends the same (empty) note to each.
 */
export function BulkConfirmModal({
  action,
  count,
  isSubmitting,
  onClose,
  onConfirm,
}: BulkConfirmModalProps) {
  if (!action) return null;

  const { title, verb, Icon, accent, confirmClassName } = CONFIRM_COPY[action];

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[440px] max-w-[calc(100vw-2rem)] items-center gap-6 rounded-2xl p-8 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
      >
        <Icon className={cn("size-12 justify-self-center", accent)} aria-hidden />

        <div className="flex flex-col items-center gap-2">
          <DialogTitle className="text-xl font-bold text-brand-navy-mid">
            {title}
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            ระบบจะ{verb}คำขอที่เลือกไว้ {count} รายการ ทีละรายการ
            ยืนยันการดำเนินการหรือไม่
          </p>
        </div>

        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-brand-navy-mid p-3 text-xs font-semibold text-brand-navy-mid hover:bg-secondary disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(
              "flex-1 rounded-lg p-3 text-xs font-bold hover:opacity-85 disabled:opacity-50",
              confirmClassName,
            )}
          >
            {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยัน"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
