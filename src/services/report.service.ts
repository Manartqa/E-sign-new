import { USE_MOCK } from "@/lib/env";
import {
  getReportOptionsApi,
  getReportSummaryApi,
  getSignatureReportApi,
} from "@/lib/api/api-main";
import { MOCK_APPLICATIONS } from "@/mocks/applications.mock";
import { MOCK_REPORT_OPTIONS, MOCK_REPORT_SUMMARY } from "@/mocks/reports.mock";
import { MOCK_USERS } from "@/mocks/users.mock";
import { MY_STEP_STATUS } from "@/types/app/applications";
import type {
  ReportOptions,
  ReportParams,
  ReportSummary,
  SignatureDecision,
  SignatureReportParams,
  SignatureReportRow,
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

const DECIDED: string[] = [
  MY_STEP_STATUS.APPROVED,
  MY_STEP_STATUS.REJECTED,
  MY_STEP_STATUS.RETURNED,
];

/**
 * รายงานสรุปการตรวจสอบและลงนาม — the officer's decisions in the range.
 * Pending steps are left out, as legacy did. The mock knows the decisions of
 * the two mock officers' queues (their `myStep`); anyone else has none.
 */
export async function getSignatureReport(
  params: SignatureReportParams,
): Promise<SignatureReportRow[]> {
  if (!USE_MOCK) {
    const res = await getSignatureReportApi({ ...params });
    return res.data.data;
  }
  const email = MOCK_USERS.find((user) => user.id === params.officerId)?.email;
  return MOCK_APPLICATIONS.flatMap((item) => {
    const step = item.myStep;
    if (
      item.officerEmail !== email ||
      !step?.decidedAt ||
      !DECIDED.includes(step.status) ||
      step.decidedAt < params.dateFrom ||
      step.decidedAt > params.dateTo ||
      (params.type !== "all" && item.type !== params.type)
    )
      return [];
    return [
      {
        id: item.id,
        decidedAt: step.decidedAt,
        typeName: item.typeName,
        requestNo: item.requestNo,
        receiptNo: item.receiptNo,
        receivedAt: item.receivedAt,
        operatorName: item.operatorName,
        decision: step.status as SignatureDecision,
        remark: step.remark,
      },
    ];
  });
}
