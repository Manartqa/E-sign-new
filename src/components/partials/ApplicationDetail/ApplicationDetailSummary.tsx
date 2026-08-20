"use client";

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
  const canAct = summary.status !== APPLICATION_STATUS.APPROVED;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-[#f8fafc] px-5 py-3.5">
        <h2 className="text-[15px] font-bold text-brand-navy-mid">ข้อมูลคำขอ</h2>
        {canAct && (
          <div className="flex flex-wrap items-center gap-3">
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
            <span className="text-[11px] text-slate-400">ตัวอย่างใบอนุญาต</span>
            <button
              type="button"
              onClick={onPreviewLicense}
              className="w-fit rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              ดูตัวอย่างใบอนุญาต/หนังสืออนุญาต
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
