"use client";

import { ChevronRight, Eye } from "lucide-react";
import { ActionButton, StatusBadge } from "@/components/common";
import { APPLICATION_STATUS } from "@/constant/status";
import { formatThaiShortDate } from "@/lib/format";
import type { ActionMode, ApplicationSummary } from "@/types/app/applications";

interface ApplicationDetailSummaryProps {
  summary: ApplicationSummary;
  onAction: (action: ActionMode) => void;
  onPreviewLicense: () => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-sm font-bold text-brand-navy-mid">{value}</span>
    </div>
  );
}

/** Figma: app-detail › ข้อมูลคำขอ card (8:86) + detail id request (156:1991) */
export function ApplicationDetailSummary({
  summary,
  onAction,
  onPreviewLicense,
}: ApplicationDetailSummaryProps) {
  // an approved application is signed and closed — nothing left to approve,
  // reject or send back, so the whole action group goes away
  const isApproved = summary.status === APPLICATION_STATUS.APPROVED;
  const canAct = !isApproved;
  // once approved there's a real license to open, not just a preview of one
  const licenseLabel = isApproved
    ? "ใบอนุญาต/หนังสืออนุญาต"
    : "ตัวอย่างใบอนุญาต";
  const licenseButtonText = isApproved
    ? "ใบอนุญาต/หนังสืออนุญาต"
    : "ดูตัวอย่างใบอนุญาต/หนังสืออนุญาต";

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-[#f8fafc] px-5 py-3.5">
        <h2 className="text-[15px] font-bold text-brand-navy-mid">ข้อมูลคำขอ</h2>
        {canAct && (
          <div className="grid w-full grid-cols-3 items-center gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
            <ActionButton action="return" onClick={() => onAction("return")} />
            <ActionButton action="reject" onClick={() => onAction("reject")} />
            <ActionButton action="approve" onClick={() => onAction("approve")} />
          </div>
        )}
      </header>

      <div className="flex flex-col px-5 py-4">
        <div className="grid grid-cols-2 gap-4 pb-3 md:grid-cols-3 xl:grid-cols-5">
          <Field label="ประเภทใบอนุญาต" value={summary.licenseType} />
          <Field label="เลขรับคำขอ" value={summary.requestNo} />
          <Field
            label="วันที่ยื่นคำขอ"
            value={formatThaiShortDate(summary.submittedAt)}
          />
          <Field label="เลขที่รับเรื่อง" value={summary.receiptNo} />
          <Field
            label="วันที่รับเรื่อง"
            value={formatThaiShortDate(summary.receivedAt)}
          />
        </div>

        <div className="h-px w-full bg-secondary" />

        <div className="grid grid-cols-2 gap-4 pt-3 md:grid-cols-3 xl:grid-cols-5">
          <Field label="เลขที่นำเรียน" value={summary.submissionNo} />
          <Field
            label="วันที่นำเรียน"
            value={formatThaiShortDate(summary.submissionDate)}
          />
          <Field label="ผู้ประกอบการ" value={summary.operatorName} />

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-400">สถานะคำขอ</span>
            <StatusBadge status={summary.status} className="w-fit px-3 py-1.5 text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-400">{licenseLabel}</span>
            <button
              type="button"
              onClick={onPreviewLicense}
              className="flex w-fit items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-b from-brand-blue to-brand-navy-mid px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Eye className="size-3" aria-hidden />
              </span>
              {licenseButtonText}
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
