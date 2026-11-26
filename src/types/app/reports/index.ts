import type { ApplicationStatus } from "@/constant/status";
import type { MasterOption } from "@/types/app/master";

/** The four cards above the charts (Figma 8:310). */
export interface ReportKpi {
  key: string;
  label: string;
  value: number;
  /** rendered as +12% / -5%, green when positive */
  deltaPercent: number;
  /** points for the card's trend sparkline, oldest → newest */
  spark: number[];
}

/** One bar of ยอดคำขอรายเดือน (Figma 8:336). */
export interface MonthlyPoint {
  label: string;
  value: number;
  /** the design paints the current month amber instead of navy */
  highlighted?: boolean;
}

/** One category of the สัดส่วน donut — a real count, so percentages derive. */
export interface BreakdownItem {
  label: string;
  value: number;
}

/** the donut can be sliced by any of these — switched from the card's dropdown */
export type BreakdownDimension = "licenseType" | "division" | "department";

/** One row of รายการลงนามล่าสุด (Figma 8:409). */
export interface RecentSignature {
  id: string;
  licenseName: string;
  officer: string;
  status: ApplicationStatus;
  at: string;
}

export interface ReportSummary {
  /** ISO timestamp shown in the "ข้อมูลอัปเดตล่าสุด" bar */
  updatedAt: string;
  kpis: ReportKpi[];
  byMonth: MonthlyPoint[];
  /** the donut's data for each dimension the dropdown can switch to */
  breakdowns: Record<BreakdownDimension, BreakdownItem[]>;
  recentSignatures: RecentSignature[];
}

/** the filter bar's backend-owned choices; ไตรมาส is fixed, so not here */
export interface ReportOptions {
  /** ปีงบประมาณ (พ.ศ.), newest first */
  fiscalYears: string[];
  reportTypes: MasterOption[];
}

export interface ReportParams {
  /** ปีงบประมาณ (พ.ศ.) */
  fiscalYear?: string;
  /** ไตรมาส — "all" | "1" | "2" | "3" | "4" */
  quarter?: string;
  /** ประเภทรายงาน */
  reportType?: string;
}

/**
 * รายงานสรุปการตรวจสอบและลงนาม — legacy SSPF's only live report
 * (docs/legacy-sspf/05-reports.md §E.3): every decision one officer made in a
 * date range, grouped by day with the day's totals.
 */
export interface SignatureReportParams {
  /** วันที่ตรวจสอบลงนาม — inclusive ISO bounds, both required */
  dateFrom: string;
  dateTo: string;
  /** ประเภทคำขอ — an application `type`, or "all" */
  type: string;
  /** เจ้าหน้าที่ตรวจสอบ/ลงนาม — a user id, required */
  officerId: string;
}

/**
 * ผ่าน / ไม่ผ่าน as legacy, plus ส่งคืน — the new system's third decision,
 * counted on its own (user's call, 2026-11-26).
 */
export type SignatureDecision = "APPROVED" | "REJECTED" | "RETURNED";

export interface SignatureReportRow {
  id: string;
  /** วันที่ตรวจสอบ/ลงนาม (ISO) */
  decidedAt: string;
  typeName: string;
  requestNo: string;
  receiptNo: string;
  receivedAt: string;
  operatorName: string;
  decision: SignatureDecision;
  /** หมายเหตุ written with the decision */
  remark: string | null;
}