import { USE_MOCK } from "@/lib/env";
import { getReportOptionsApi, getReportSummaryApi } from "@/lib/api/api-main";
import { MOCK_REPORT_OPTIONS, MOCK_REPORT_SUMMARY } from "@/mocks/reports.mock";
import type {
  ReportOptions,
  ReportParams,
  ReportSummary,
} from "@/types/app/reports";

export async function getReportSummary(
  params: ReportParams = {},
): Promise<ReportSummary> {
  if (USE_MOCK) return MOCK_REPORT_SUMMARY;
  const res = await getReportSummaryApi({ ...params });
  return res.data.data;
}

export async function getReportOptions(): Promise<ReportOptions> {
  if (USE_MOCK) return MOCK_REPORT_OPTIONS;
  const res = await getReportOptionsApi();
  return res.data.data;
}
