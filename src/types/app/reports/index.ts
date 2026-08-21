import type { ApplicationStatus } from "@/constant/status";

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

export interface ReportParams {
  /** ปีงบประมาณ (พ.ศ.) */
  fiscalYear?: string;
  /** ไตรมาส — "all" | "1" | "2" | "3" | "4" */
  quarter?: string;
  /** ประเภทรายงาน */
  reportType?: string;
}
