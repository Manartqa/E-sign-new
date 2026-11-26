import dayjs from "dayjs";
import type {
  SignatureDecision,
  SignatureReportParams,
  SignatureReportRow,
} from "@/types/app/reports";

/** legacy texts (05-reports.md §E.3.3), verbatim */
export const REPORT_MESSAGES = {
  DATES: "กรุณาเลือกวันที่ตรวจสอบลงนามให้ครบ",
  DATE_ORDER: "วันที่ตรวจสอบลงนามเริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด",
  OFFICER: "กรุณาเลือกเจ้าหน้าที่ตรวจสอบ/ลงนาม",
} as const;

export const DECISION_LABELS: Record<SignatureDecision, string> = {
  APPROVED: "ผ่าน",
  REJECTED: "ไม่ผ่าน",
  RETURNED: "ส่งคืน",
};

/** legacy opened on today – today */
export function defaultSignatureReportParams(now = dayjs()): SignatureReportParams {
  return {
    dateFrom: now.startOf("day").toISOString(),
    dateTo: now.endOf("day").toISOString(),
    type: "all",
    officerId: "",
  };
}

/** the first thing wrong with the filters, in legacy's order, or undefined */
export function validateSignatureReport(
  params: SignatureReportParams,
): string | undefined {
  if (!params.dateFrom || !params.dateTo) return REPORT_MESSAGES.DATES;
  if (params.dateFrom > params.dateTo) return REPORT_MESSAGES.DATE_ORDER;
  if (!params.officerId) return REPORT_MESSAGES.OFFICER;
}

export type DecisionTotals = Record<SignatureDecision, number>;

const emptyTotals = (): DecisionTotals => ({ APPROVED: 0, REJECTED: 0, RETURNED: 0 });

export interface ReportDay {
  /** YYYY-MM-DD, local time */
  day: string;
  rows: SignatureReportRow[];
  totals: DecisionTotals;
}

/**
 * Rows grouped by the local day of the decision, days and rows oldest first,
 * each day with its ผ่าน / ไม่ผ่าน / ส่งคืน totals, plus the grand totals.
 */
export function groupByDay(rows: SignatureReportRow[]): {
  days: ReportDay[];
  totals: DecisionTotals;
} {
  const totals = emptyTotals();
  const byDay = new Map<string, ReportDay>();
  for (const row of [...rows].sort((a, b) => a.decidedAt.localeCompare(b.decidedAt))) {
    const day = dayjs(row.decidedAt).format("YYYY-MM-DD");
    const entry = byDay.get(day) ?? { day, rows: [], totals: emptyTotals() };
    entry.rows.push(row);
    entry.totals[row.decision] += 1;
    totals[row.decision] += 1;
    byDay.set(day, entry);
  }
  return { days: [...byDay.values()], totals };
}
