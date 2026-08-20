import type { ApplicationStatus } from "@/constant/status";

/** The four cards above the charts (Figma 8:310). */
export interface ReportKpi {
  key: string;
  label: string;
  value: number;
  /** rendered as +12% / -5%, green when positive */
  deltaPercent: number;
}

/** One bar of ยอดคำขอรายเดือน (Figma 8:336). */
export interface MonthlyPoint {
  label: string;
  value: number;
  /** the design paints the current month amber instead of navy */
  highlighted?: boolean;
}

/** One slice of สัดส่วนตามประเภทใบอนุญาต (Figma 8:378). */
export interface LicenseTypeShare {
  label: string;
  percent: number;
}

/** One row of รายการลงนามล่าสุด (Figma 8:409). */
export interface RecentSignature {
  id: string;
  licenseName: string;
  officer: string;
  status: ApplicationStatus;
  at: string;
}

export interface ReportSummary {
  kpis: ReportKpi[];
  byMonth: MonthlyPoint[];
  byLicenseType: LicenseTypeShare[];
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
