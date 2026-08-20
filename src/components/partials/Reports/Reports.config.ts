import type { ReportParams } from "@/types/app/reports";

export const REPORTS_STORAGE_KEY = "reports-filters";

export const DEFAULT_REPORT_FILTERS: ReportParams = {
  fiscalYear: "2569",
  quarter: "all",
  reportType: "summary",
};
