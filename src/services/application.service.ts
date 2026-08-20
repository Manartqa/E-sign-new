import { USE_MOCK } from "@/lib/env";
import {
  approveApplicationApi,
  getApplicationDetailApi,
  getApplicationsApi,
  signApplicationApi,
} from "@/lib/api/api-main";
import type { ApproveRequest, SignRequest } from "@/types/api/main/application";
import type {
  ApplicationDetail,
  ApplicationItem,
  ApplicationListParams,
  ApplicationListResult,
} from "@/types/app/applications";
import { MOCK_APPLICATIONS, buildMockDetail } from "@/mocks/applications.mock";

const DEFAULT_LIMIT = 10;

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Every function below has a `USE_MOCK` branch. When the real API lands,
 * set NEXT_PUBLIC_USE_MOCK=false and delete the mock branches. Nothing in
 * hooks/ or components/ needs to change.
 */

function toItem(raw: {
  id: string;
  type: string;
  typeName: string;
  applicant: { name: string; nationalId: string };
  status: ApplicationItem["status"];
  submittedAt: string;
  updatedAt: string;
  assignedOfficer: string;
}): ApplicationItem {
  return {
    id: raw.id,
    type: raw.type,
    typeName: raw.typeName,
    applicantName: raw.applicant.name,
    applicantNationalId: raw.applicant.nationalId,
    status: raw.status,
    submittedAt: raw.submittedAt,
    updatedAt: raw.updatedAt,
    assignedOfficer: raw.assignedOfficer,
  };
}

export async function getApplicationList(
  params: ApplicationListParams = {},
): Promise<ApplicationListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;

  if (USE_MOCK) {
    const keyword = params.keyword?.trim().toLowerCase() ?? "";
    const filtered = MOCK_APPLICATIONS.filter((item) => {
      if (params.status && params.status !== "all" && item.status !== params.status)
        return false;
      if (params.type && params.type !== "all" && item.type !== params.type)
        return false;
      if (
        keyword &&
        !`${item.id} ${item.applicantName} ${item.typeName}`
          .toLowerCase()
          .includes(keyword)
      )
        return false;
      return true;
    });
    const start = (page - 1) * limit;
    return {
      items: filtered.slice(start, start + limit),
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

export async function getApplicationDetail(
  id: string,
): Promise<ApplicationDetail | null> {
  if (USE_MOCK) {
    const item = MOCK_APPLICATIONS.find((a) => a.id === id);
    return item ? buildMockDetail(item) : null;
  }
  const res = await getApplicationDetailApi(id);
  const raw = res.data.data;
  return {
    ...toItem(raw),
    sections: raw.sections ?? {},
    attachments: raw.attachments ?? [],
    timeline: raw.timeline ?? [],
  };
}

export async function approveApplication(id: string, body: ApproveRequest) {
  if (USE_MOCK) return { ok: true };
  await approveApplicationApi(id, body);
  return { ok: true };
}

export async function signApplication(id: string, body: SignRequest) {
  if (USE_MOCK) return { ok: true };
  await signApplicationApi(id, body);
  return { ok: true };
}
