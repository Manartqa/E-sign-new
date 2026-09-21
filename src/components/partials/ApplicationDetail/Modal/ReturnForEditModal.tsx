"use client";

import { useState } from "react";
import { RotateCcw, X, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LabeledSelect } from "@/components/common";
import { Textarea } from "@/components/ui/textarea";
import { useDecisionReasons } from "@/hooks/master";
import { cn } from "@/lib/utils";
import type { ReturnFormValues } from "@/types/app/applications";

interface ReturnForEditModalProps {
  open: boolean;
  /**
   * Figma only designs the `ส่งคืนเพื่อแก้ไข` modal (8:490). `reject` reuses
   * the same layout with its own wording and amber→red accent, since the
   * ไม่อนุมัติ button has no modal of its own in the file.
   */
  mode: "return" | "reject";
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (values: ReturnFormValues) => void;
}

export function ReturnForEditModal({
  open,
  mode,
  isSubmitting,
  onClose,
  onConfirm,
}: ReturnForEditModalProps) {
  const isReject = mode === "reject";
  const { options: reasons } = useDecisionReasons(isReject ? "REJECT" : "RETURN");

  // the list loads async, so the first reason is the default until one is picked
  const [pickedReason, setPickedReason] = useState<string | null>(null);
  const reasonCode = pickedReason ?? reasons[0]?.value ?? "";
  const [notes, setNotes] = useState("");

  const canSubmit = reasonCode !== "" && notes.trim() !== "" && !isSubmitting;
  const Icon = isReject ? XCircle : RotateCcw;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[560px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
      >
        <header className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <Icon className="size-5 text-brand-navy-mid" aria-hidden />
            <DialogTitle className="text-lg font-bold text-brand-navy-mid">
              {isReject ? "ไม่อนุมัติคำขอ" : "ส่งคืนเพื่อแก้ไข"}
            </DialogTitle>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด">
            <X className="size-5 text-muted-foreground" aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-6">
          <LabeledSelect
            label={isReject ? "ระบุสาเหตุที่ไม่อนุมัติ" : "ระบุสาเหตุที่ส่งคืน"}
            labelClassName="text-sm font-semibold text-black"
            triggerClassName="p-3"
            value={reasonCode}
            options={reasons}
            onChange={setPickedReason}
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="return-notes" className="text-sm font-semibold text-black">
              รายละเอียดเพิ่มเติม (Required)
            </label>
            <Textarea
              id="return-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="กรุณาระบุรายละเอียดส่วนที่ต้องการให้ผู้ยื่นคำขอแก้ไข..."
              className="h-30 resize-none rounded-lg border bg-[#f8fafc] p-3 text-sm"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end bg-[#f8fafc] p-5">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm({ reasonCode, notes })}
            className={cn(
              "rounded-lg px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50",
              isReject
                ? "bg-action-reject hover:opacity-90"
                : "bg-action-return hover:opacity-90",
            )}
          >
            {isSubmitting
              ? "กำลังบันทึก..."
              : isReject
                ? "ยืนยันการไม่อนุมัติ"
                : "ยืนยันการส่งคืน"}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
