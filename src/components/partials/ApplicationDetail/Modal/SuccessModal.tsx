"use client";

import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface SuccessModalProps {
  open: boolean;
  requestNo: string;
  onBackToList: () => void;
  onDownload: () => void;
}

/** Figma: modals-overlays › 2. Success State (8:476) */
export function SuccessModal({
  open,
  requestNo,
  onBackToList,
  onDownload,
}: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onBackToList()}>
      <DialogContent
        showCloseButton={false}
        className="w-[420px] max-w-[calc(100vw-2rem)] items-center gap-6 rounded-2xl p-10 shadow-[0_32px_32px_rgba(0,0,0,0.25)]"
      >
        <span className="flex size-20 items-center justify-center rounded-full bg-action-approve/8">
          <CheckCircle2 className="size-10 text-action-approve" aria-hidden />
        </span>

        <div className="flex flex-col items-center gap-2">
          <DialogTitle className="text-2xl font-bold text-action-approve">
            ลงนามสำเร็จ!
          </DialogTitle>
          <p className="text-center text-[15px] text-muted-foreground">
            ระบบได้ทำการบันทึกข้อมูลและส่งมอบเอกสารใบอนุญาต {requestNo}{" "}
            เข้าสู่ระบบสารบรรณแล้ว
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onBackToList}
            className="w-full rounded-lg bg-brand-navy-mid p-3 text-xs font-semibold text-white hover:bg-brand-navy-hover"
          >
            กลับไปหน้าคำขอทั้งหมด
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="w-full rounded-lg border border-brand-navy-mid p-3 text-xs font-semibold text-brand-navy-mid hover:bg-secondary"
          >
            ดาวน์โหลดเอกสาร
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
