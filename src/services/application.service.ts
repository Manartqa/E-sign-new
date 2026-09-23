import { USE_MOCK } from "@/lib/env";
import {
  decideApplicationApi,
  getApplicationDetailApi,
  getApplicationStatsApi,
  getApplicationsApi,
  signApplicationApi,
} from "@/lib/api/api-main";
import type {
  ApplicationResponse,
  DecisionRequest,
  SignRequest,
} from "@/types/api/main/application";
import type {
  ApplicationDetail,
  ApplicationItem,
  ApplicationListParams,
  ApplicationListResult,
  ApplicationStats,
} from "@/types/app/applications";
import {
  APPLICATION_STATUS,
  REJECTED_OR_RETURNED_FILTER,
} from "@/constant/status";
import { getSession } from "next-auth/react";
import { sortRows } from "@/lib/sort";
import { MOCK_APPLICATIONS } from "@/mocks/applications.mock";
import { buildMockDetail } from "@/mocks/applicationDetail.mock";

const DEFAULT_LIMIT = 10;

/**
 * mock stand-in for the backend scoping the list to the caller's token: each
 * request sits in one officer's queue, so signing in as the other officer
 * shows a different set of requests.
 */
async function myMockApplications() {
  const email = (await getSession())?.user?.email?.toLowerCase();
  return MOCK_APPLICATIONS.filter((item) => item.officerEmail === email);
}

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Every function below has a `USE_MOCK` branch. When the real API lands,
 * set NEXT_PUBLIC_USE_MOCK=false and delete the mock branches. Nothing in
 * hooks/ or components/ needs to change.
 */

function toItem(raw: ApplicationResponse): ApplicationItem {
  return {
    id: raw.id,
    type: raw.type,
    typeName: raw.typeName,
    requestNo: raw.requestNo,
    receiptNo: raw.receiptNo,
    receivedAt: raw.receivedAt,
    operatorName: raw.operatorName,
    applicantName: raw.applicant.name,
    applicantNationalId: raw.applicant.nationalId,
    status: raw.status,
    submittedAt: raw.submittedAt,
    updatedAt: raw.updatedAt,
    assignedOfficer: raw.assignedOfficer,
    isFinalSigner: raw.isFinalSigner,
    isUrgent: raw.isUrgent,
  };
}

export async function getApplicationList(
  params: ApplicationListParams = {},
): Promise<ApplicationListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;

  if (USE_MOCK) {
    const keyword = params.keyword?.trim().toLowerCase() ?? "";
    const filtered = (await myMockApplications()).filter((item) => {
      if (params.status === REJECTED_OR_RETURNED_FILTER) {
        if (
          item.status !== APPLICATION_STATUS.REJECTED &&
          item.status !== APPLICATION_STATUS.RETURNED
        )
          return false;
      } else if (
        params.status &&
        params.status !== "all" &&
        item.status !== params.status
      ) {
        return false;
      }
      if (params.type && params.type !== "all" && item.type !== params.type)
        return false;
      if (params.urgent === "only" && !item.isUrgent) return false;
      // ช่วงวันที่ filters on วันที่รับเรื่อง, the date shown in the table
      if (params.dateFrom && item.receivedAt < params.dateFrom) return false;
      if (params.dateTo && item.receivedAt > params.dateTo) return false;
      if (
        keyword &&
        !`${item.requestNo} ${item.receiptNo} ${item.operatorName} ${item.applicantName} ${item.typeName}`
          .toLowerCase()
          .includes(keyword)
      )
        return false;
      return true;
    });
    // the backend orders the whole result before paging; so does the mock
    const sorted = sortRows(filtered, params, (item, key) =>
      key === "status"
        ? Object.values(APPLICATION_STATUS).indexOf(item.status)
        : item[key as keyof ApplicationItem],
    );
    // ด่วน outranks the officer's own sort: an urgent request must be on the
    // first page whatever column they ordered by. Their sort still decides the
    // order inside each group. The real endpoint owes the same ORDER BY —
    // pinning here only would float urgent rows within the current page.
    const ordered = [
      ...sorted.filter((item) => item.isUrgent),
      ...sorted.filter((item) => !item.isUrgent),
    ];
    const start = (page - 1) * limit;
    return {
      items: ordered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  const res = await getApplicationsApi({ ...params, page, limit });
  return {
    items: (res.data.data ?? []).map(toItem),
    total: res.data.total ?? 0,
    page: res.data.page ?? page,
    limit: res.data.limit ?? limit,
  };
}

/** Feeds the four stat cards above the table (Figma 6:293) and the sidebar badge. */
export async function getApplicationStats(): Promise<ApplicationStats> {
  if (!USE_MOCK) {
    const res = await getApplicationStatsApi();
    return res.data.data;
  }

  const list = await myMockApplications();
  const countBy = (status: ApplicationItem["status"]) =>
    list.filter((item) => item.status === status).length;

  return {
    total: list.length,
    pending: countBy(APPLICATION_STATUS.PENDING_APPROVAL),
    approved: countBy(APPLICATION_STATUS.APPROVED),
    rejectedOrReturned:
      countBy(APPLICATION_STATUS.REJECTED) +
      countBy(APPLICATION_STATUS.RETURNED),
  };
}

export async function getApplicationDetail(
  id: string,
): Promise<ApplicationDetail | null> {
  if (USE_MOCK) {
    const item = (await myMockApplications()).find((a) => a.id === id);
    return item ? buildMockDetail(item) : null;
  }
  const res = await getApplicationDetailApi(id);
  const raw = res.data.data;
  return { ...toItem(raw), summary: raw.summary, panels: raw.panels };
}

/** ไม่อนุมัติ / ส่งคืนเพื่อแก้ไข */
export async function decideApplication(id: string, body: DecisionRequest) {
  if (USE_MOCK) return { ok: true };
  await decideApplicationApi(id, body);
  return { ok: true };
}

export async function signApplication(id: string, body: SignRequest) {
  if (USE_MOCK) return { ok: true };
  await signApplicationApi(id, body);
  return { ok: true };
}
