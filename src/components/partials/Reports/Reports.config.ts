import type { ReportParams } from "@/types/app/reports";

export const REPORTS_STORAGE_KEY = "reports-filters";

export const DEFAULT_REPORT_FILTERS: ReportParams = {
  fiscalYear: "2569",
  quarter: "all",
  reportType: "summary",
};

/** ไตรมาส is fixed by the calendar, so it stays here rather than in master data */
export const QUARTER_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "1", label: "ไตรมาส 1" },
  { value: "2", label: "ไตรมาส 2" },
  { value: "3", label: "ไตรมาส 3" },
  { value: "4", label: "ไตรมาส 4" },
];
