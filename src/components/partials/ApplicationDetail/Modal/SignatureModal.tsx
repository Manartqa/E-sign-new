"use client";

import { AlertTriangle, FileSignature, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatThaiShortDate } from "@/lib/format";
import type { ApplicationItem } from "@/types/app/applications";
import type { UserProfile } from "@/types/app/profile";
import { MOCK_CERTIFICATE } from "../ApplicationDetail.config";

interface SignatureModalProps {
  open: boolean;
  /** only the shared list/detail fields are read, so either fits */
  detail: ApplicationItem;
  signer: UserProfile | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Figma: modals-overlays › 1. Digital Signature Confirmation (8:444) */
export function SignatureModal({
  open,
  detail,
  signer,
  isSubmitting,
  onClose,
  onConfirm,
}: SignatureModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[560px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
      >
        <header className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <FileSignature className="size-5 text-brand-navy-mid" aria-hidden />
            <DialogTitle className="text-lg font-bold text-brand-navy-mid">
              ยืนยันการลงนามดิจิทัล
            </DialogTitle>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด">
            <X className="size-5 text-muted-foreground" aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2 rounded-lg bg-[#f8fafc] p-4">
            <p className="text-[13px] font-bold text-black">รายละเอียดเอกสาร</p>
            <p className="text-sm text-black">
              {detail.typeName} ({detail.requestNo})
            </p>
            <p className="text-[13px] text-muted-foreground">
              ผู้ยื่น: {detail.applicantName} | ผู้ประกอบการ:{" "}
              {detail.operatorName}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-black">
              ลายมือชื่อดิจิทัล (Digital Signature Preview)
            </p>
            <div className="flex h-30 items-center justify-center rounded-lg border border-dashed">
              <span className="text-lg text-slate-400">
                {signer?.name ?? "—"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-black">
              ใบรับรองอิเล็กทรอนิกส์ (Certificate)
            </p>
            <p className="text-[13px] text-black">
              Issued to: {signer?.name ?? "—"} ({MOCK_CERTIFICATE.issuer})
            </p>
            <p className="text-xs text-slate-400">
              Valid: {formatThaiShortDate(MOCK_CERTIFICATE.validFrom)} -{" "}
              {formatThaiShortDate(MOCK_CERTIFICATE.validTo)}
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-action-return bg-action-return/8 p-3">
            <AlertTriangle
              className="size-4 shrink-0 text-action-return"
              aria-hidden
            />
            <p className="text-[13px] text-status-pending-approval-fg">
              การลงนามนี้มีผลผูกพันทางกฎหมายตาม พ.ร.บ.
              ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 bg-[#f8fafc] p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-brand-navy-mid px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-60"
          >
            {isSubmitting ? "กำลังลงนาม..." : "ยืนยันการลงนาม"}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
