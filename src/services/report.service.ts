import { USE_MOCK } from "@/lib/env";
import { getReportSummaryApi } from "@/lib/api/api-main";
import { MOCK_REPORT_SUMMARY } from "@/mocks/reports.mock";
import type { ReportParams, ReportSummary } from "@/types/app/reports";

export async function getReportSummary(
  params: ReportParams = {},
): Promise<ReportSummary> {
  if (USE_MOCK) return MOCK_REPORT_SUMMARY;
  const res = await getReportSummaryApi({ ...params });
  return res.data.data;
}
