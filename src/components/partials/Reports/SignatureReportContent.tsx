"use client";

import { Fragment, useMemo, useState, type FormEvent } from "react";
import { Printer } from "lucide-react";
import {
  DateRangePicker,
  EmptyState,
  ErrorState,
  FILTER_TRIGGER,
  LabeledSelect,
  LoadingState,
  SearchableSelect,
} from "@/components/common";
import { useApplicationTypes } from "@/hooks/master";
import { useSignatureReport } from "@/hooks/reports";
import { useUserList } from "@/hooks/users";
import { formatThaiDate, formatThaiDateTime, formatThaiShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SignatureReportParams } from "@/types/app/reports";
import {
  DECISION_LABELS,
  defaultSignatureReportParams,
  groupByDay,
  validateSignatureReport,
  type DecisionTotals,
} from "./SignatureReport.config";

const TH = "px-3 py-2.5 text-left text-sm font-bold whitespace-nowrap text-brand-navy-mid";
const TD = "px-3 py-2 align-top text-sm text-foreground";

const DECISION_CLASS = {
  APPROVED: "text-status-approved-fg",
  REJECTED: "text-status-rejected-fg",
  RETURNED: "text-status-returned-fg",
} as const;

const totalsText = (totals: DecisionTotals) =>
  (Object.keys(DECISION_LABELS) as (keyof DecisionTotals)[])
    .map((key) => `${DECISION_LABELS[key]} ${totals[key]}`)
    .join(" · ");

/**
 * รายงาน › รายงานสรุปการตรวจสอบและลงนาม — legacy SSPF's only live report
 * (05-reports.md §E.3), not in Figma. One column set for screen and print
 * (legacy's grid and PDF disagreed); the PDF is the browser's print of this
 * page, A4 landscape (user's call, 2026-11-26).
 */
export default function SignatureReportContent() {
  const [draft, setDraft] = useState<SignatureReportParams>(() =>
    defaultSignatureReportParams(),
  );
  const [submitted, setSubmitted] = useState<SignatureReportParams | null>(null);
  const [error, setError] = useState<string>();

  const { options: types } = useApplicationTypes();
  const typeOptions = useMemo(
    () => [{ value: "all", label: "ทั้งหมด" }, ...types],
    [types],
  );
  // legacy listed every officer with a level, inactive ones included
  const { items: users, isLoading: usersLoading } = useUserList({ page: 1, limit: 500 });
  const officerOptions = useMemo(
    () =>
      users
        .filter((user) => user.approvalLevel)
        .map((user) => ({
          value: user.id,
          label: user.position ? `${user.name} — ${user.position}` : user.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "th")),
    [users],
  );

  const { rows, isFetching, isError } = useSignatureReport(submitted);
  const report = useMemo(() => (rows ? groupByDay(rows) : null), [rows]);
  const officerName = officerOptions.find((o) => o.value === submitted?.officerId)?.label;
  const typeName = typeOptions.find((o) => o.value === submitted?.type)?.label;

  const run = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateSignatureReport(draft);
    setError(problem);
    if (!problem) setSubmitted(draft);
  };

  let rowNo = 0;

  return (
    <div className="flex flex-col gap-4 print:gap-2">
      {/* A4 landscape for this page's print only */}
      <style>{"@page { size: A4 landscape; margin: 12mm; }"}</style>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">
          รายงานสรุปการตรวจสอบและลงนาม
        </h1>
        <p className="text-sm text-muted-foreground print:hidden">
          ผลการพิจารณาของเจ้าหน้าที่ตรวจสอบ/ลงนาม ในช่วงวันที่ที่เลือก แยกตามวัน
        </p>
      </div>

      <form
        onSubmit={run}
        noValidate
        className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:p-6 lg:flex-row lg:items-end print:hidden"
      >
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-[#334155]">
            วันที่ตรวจสอบลงนาม<span className="ml-1 text-destructive">*</span>
          </span>
          <DateRangePicker
            value={{ from: draft.dateFrom, to: draft.dateTo }}
            onChange={(range) =>
              setDraft((d) => ({ ...d, dateFrom: range.from ?? "", dateTo: range.to ?? "" }))
            }
            triggerClassName="h-[42px]"
          />
        </div>
        <LabeledSelect
          label="ประเภทคำขอ"
          className="min-w-[200px] flex-1"
          labelClassName="text-[#334155]"
          triggerClassName={FILTER_TRIGGER}
          value={draft.type}
          options={typeOptions}
          onChange={(type) => setDraft((d) => ({ ...d, type }))}
        />
        <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
          <label htmlFor="report-officer" className="text-sm font-medium text-[#334155]">
            เจ้าหน้าที่ตรวจสอบ/ลงนาม<span className="ml-1 text-destructive">*</span>
          </label>
          <SearchableSelect
            id="report-officer"
            ariaLabel="เจ้าหน้าที่ตรวจสอบ/ลงนาม"
            value={draft.officerId}
            options={officerOptions}
            isLoading={usersLoading}
            placeholder="เลือกเจ้าหน้าที่"
            searchPlaceholder="ค้นหาชื่อ หรือตำแหน่ง"
            invalid={error === "กรุณาเลือกเจ้าหน้าที่ตรวจสอบ/ลงนาม"}
            onChange={(officerId) => setDraft((d) => ({ ...d, officerId }))}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg bg-brand-navy-mid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover"
          >
            ค้นหา
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!report || report.days.length === 0}
            className="flex items-center gap-2 rounded-lg border border-brand-navy-mid px-4 py-2.5 text-sm font-semibold text-brand-navy-mid hover:bg-secondary disabled:opacity-50"
          >
            <Printer className="size-4" aria-hidden />
            พิมพ์ / บันทึก PDF
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive print:hidden">
          {error}
        </p>
      )}

      {!submitted ? (
        <EmptyState
          title="ยังไม่ได้ออกรายงาน"
          description="เลือกช่วงวันที่และเจ้าหน้าที่ แล้วกด ค้นหา"
        />
      ) : isError ? (
        <ErrorState />
      ) : isFetching || !report ? (
        <LoadingState rows={6} />
      ) : report.days.length === 0 ? (
        <EmptyState
          title="ไม่พบข้อมูล"
          description="เจ้าหน้าที่ไม่มีการตรวจสอบหรือลงนามในช่วงวันที่ที่เลือก"
        />
      ) : (
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4 print:border-0 print:p-0">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">เจ้าหน้าที่: </span>
              <span className="font-semibold">{officerName}</span>
              <span className="text-muted-foreground"> · ประเภทคำขอ: </span>
              {typeName}
            </p>
            <p>
              <span className="text-muted-foreground">วันที่ตรวจสอบลงนาม: </span>
              {formatThaiDate(submitted.dateFrom)} – {formatThaiDate(submitted.dateTo)}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border print:overflow-visible">
            <table className="w-full border-collapse text-left">
              <thead className="border-b bg-[#f8fafc]">
                <tr>
                  <th className={TH}>ลำดับ</th>
                  <th className={TH}>วันที่ตรวจสอบ/ลงนาม</th>
                  <th className={TH}>ประเภทคำขอ</th>
                  <th className={TH}>เลขที่คำขอ</th>
                  <th className={TH}>เลขรับเรื่อง</th>
                  <th className={TH}>วันที่รับเรื่อง</th>
                  <th className={TH}>ผู้ประกอบการ</th>
                  <th className={TH}>ผลการพิจารณา</th>
                  <th className={TH}>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {report.days.map((day) => (
                  <Fragment key={day.day}>
                    <tr className="border-b bg-brand-navy-mid/5">
                      <td colSpan={9} className="px-3 py-2 text-sm font-bold text-brand-navy-mid">
                        วันที่ {formatThaiDate(day.rows[0].decidedAt)}
                      </td>
                    </tr>
                    {day.rows.map((row) => (
                      <tr key={row.id} className="border-b break-inside-avoid">
                        <td className={TD}>{++rowNo}</td>
                        <td className={cn(TD, "whitespace-nowrap")}>
                          {formatThaiDateTime(row.decidedAt)}
                        </td>
                        <td className={TD}>{row.typeName}</td>
                        <td className={cn(TD, "whitespace-nowrap")}>{row.requestNo}</td>
                        <td className={cn(TD, "whitespace-nowrap")}>{row.receiptNo}</td>
                        <td className={cn(TD, "whitespace-nowrap")}>
                          {formatThaiShortDate(row.receivedAt)}
                        </td>
                        <td className={TD}>{row.operatorName}</td>
                        <td className={cn(TD, "font-semibold", DECISION_CLASS[row.decision])}>
                          {DECISION_LABELS[row.decision]}
                        </td>
                        <td className={TD}>{row.remark ?? "—"}</td>
                      </tr>
                    ))}
                    <tr className="border-b">
                      <td colSpan={9} className="px-3 py-2 text-right text-sm text-muted-foreground">
                        รวมวันที่ {formatThaiDate(day.rows[0].decidedAt)}: {totalsText(day.totals)}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#f8fafc]">
                  <td colSpan={9} className="px-3 py-2.5 text-right text-sm font-bold text-brand-navy-mid">
                    รวมทั้งหมด {rowNo} รายการ: {totalsText(report.totals)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
