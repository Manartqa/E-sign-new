"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface BulkFailure {
  requestNo: string;
  message?: string;
}

interface BulkResultModalProps {
  /** e.g. "อนุมัติและลงนาม" */
  verb: string;
  succeeded: number;
  failures: BulkFailure[];
  onClose: () => void;
}

/**
 * Not in Figma: what a batch did when some rows did not go through — each
 * failed request with the backend's reason (already decided, not this
 * officer's turn, …). The failed rows stay selected for a retry.
 */
export function BulkResultModal({
  verb,
  succeeded,
  failures,
  onClose,
}: BulkResultModalProps) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[520px] max-w-[calc(100vw-2rem)] gap-5 rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-5 text-action-return" aria-hidden />
          <DialogTitle className="text-lg font-bold text-brand-navy-mid">
            ผลการ{verb}
          </DialogTitle>
        </div>

        <p className="text-sm text-black">
          สำเร็จ {succeeded} รายการ · ไม่สำเร็จ {failures.length} รายการ
        </p>

        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {failures.map((failure) => (
            <li
              key={failure.requestNo}
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px]"
            >
              <span className="font-semibold text-black">
                คำขอ {failure.requestNo}
              </span>
              <span className="text-muted-foreground">
                {" — "}
                {failure.message ?? "ดำเนินการไม่สำเร็จ"}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">
          รายการที่ไม่สำเร็จยังคงถูกเลือกไว้ เพื่อดำเนินการใหม่ได้ทันที
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-brand-navy-mid px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-navy-hover"
          >
            ปิด
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
