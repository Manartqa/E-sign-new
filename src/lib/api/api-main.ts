import type { PagedResponse, ApiResponse } from "@/types/api/main/common";
import type {
  ApplicationResponse,
  ApplicationDetailResponse,
  ApplicationStatsResponse,
  DecisionRequest,
  SignRequest,
} from "@/types/api/main/application";
import type {
  ChangePasswordRequest,
  UserResponse,
} from "@/types/api/main/user";
import type { NotificationResponse } from "@/types/api/main/notification";
import type { MasterOptionResponse } from "@/types/api/main/master";
import type {
  ReportOptionsResponse,
  ReportSummaryResponse,
} from "@/types/api/main/report";
import type {
  SigningWorkflowRequest,
  SigningWorkflowResponse,
} from "@/types/api/main/signingWorkflow";
import type {
  CertificateCheckResponse,
  SignerResponse,
} from "@/types/api/main/signer";
import type { RoleRequest, RoleResponse } from "@/types/api/main/role";
import { mainClient } from "./client";

/* Endpoints mirror the `API Endpoints` table in the Figma developer-handoff. */

export const getApplicationsApi = (params?: Record<string, unknown>) =>
  mainClient.get<PagedResponse<ApplicationResponse>>("/api/applications", {
    params,
  });

export const getApplicationDetailApi = (id: string) =>
  mainClient.get<ApiResponse<ApplicationDetailResponse>>(
    `/api/applications/${id}`,
  );

export const getApplicationStatsApi = () =>
  mainClient.get<ApiResponse<ApplicationStatsResponse>>(
    "/api/applications/stats",
  );

/** ไม่อนุมัติ / ส่งคืนเพื่อแก้ไข — not in the handoff; names are ours */
export const decideApplicationApi = (id: string, body: DecisionRequest) =>
  mainClient.patch<ApiResponse<ApplicationDetailResponse>>(
    `/api/applications/${id}/decision`,
    body,
  );

export const signApplicationApi = (id: string, body: SignRequest) =>
  mainClient.post<ApiResponse<ApplicationDetailResponse>>(
    `/api/applications/${id}/sign`,
    body,
  );

export const getReportSummaryApi = (params?: Record<string, unknown>) =>
  mainClient.get<ApiResponse<ReportSummaryResponse>>("/api/reports/summary", {
    params,
  });

export const getReportOptionsApi = () =>
  mainClient.get<ApiResponse<ReportOptionsResponse>>("/api/reports/options");

export const getProfileApi = () =>
  mainClient.get<ApiResponse<UserResponse>>("/api/me");

export const updateProfileApi = (body: Partial<UserResponse>) =>
  mainClient.patch<ApiResponse<UserResponse>>("/api/me", body);

export const changePasswordApi = (body: ChangePasswordRequest) =>
  mainClient.post<ApiResponse<null>>("/api/me/password", body);

/* Notifications — not in the handoff's endpoint table; names are ours. */

export const getNotificationsApi = () =>
  mainClient.get<ApiResponse<NotificationResponse[]>>("/api/notifications");

export const markNotificationReadApi = (id: string) =>
  mainClient.patch<ApiResponse<null>>(`/api/notifications/${id}/read`);

export const markAllNotificationsReadApi = () =>
  mainClient.patch<ApiResponse<null>>("/api/notifications/read-all");

/* Signing workflows (ตั้งค่าระบบ) — not in the handoff; names are ours. */

export const getSigningWorkflowsApi = (params?: Record<string, unknown>) =>
  mainClient.get<PagedResponse<SigningWorkflowResponse>>(
    "/api/signing-workflows",
    { params },
  );

export const getSigningWorkflowApi = (id: string) =>
  mainClient.get<ApiResponse<SigningWorkflowResponse>>(
    `/api/signing-workflows/${id}`,
  );

export const createSigningWorkflowApi = (body: SigningWorkflowRequest) =>
  mainClient.post<ApiResponse<SigningWorkflowResponse>>(
    "/api/signing-workflows",
    body,
  );

export const updateSigningWorkflowApi = (
  id: string,
  body: SigningWorkflowRequest,
) =>
  mainClient.put<ApiResponse<SigningWorkflowResponse>>(
    `/api/signing-workflows/${id}`,
    body,
  );

export const deleteSigningWorkflowApi = (id: string) =>
  mainClient.delete<ApiResponse<null>>(`/api/signing-workflows/${id}`);

/* Signers — ผู้มีอำนาจลงนาม (ตั้งค่าระบบ); not in the handoff; names are ours. */

export const getSignersApi = (params?: Record<string, unknown>) =>
  mainClient.get<PagedResponse<SignerResponse>>("/api/signers", { params });

export const getSignerApi = (id: string) =>
  mainClient.get<ApiResponse<SignerResponse>>(`/api/signers/${id}`);

/** ตำแหน่ง master list for the signer form */
export const getPositionsApi = () =>
  mainClient.get<ApiResponse<string[]>>("/api/positions");

/* create / update / certificate check send multipart/form-data */

export const createSignerApi = (body: FormData) =>
  mainClient.post<ApiResponse<SignerResponse>>("/api/signers", body);

export const updateSignerApi = (id: string, body: FormData) =>
  mainClient.put<ApiResponse<SignerResponse>>(`/api/signers/${id}`, body);

export const checkSignerCertificateApi = (body: FormData) =>
  mainClient.post<ApiResponse<CertificateCheckResponse>>(
    "/api/signers/certificate-check",
    body,
  );

export const deleteSignerApi = (id: string) =>
  mainClient.delete<ApiResponse<null>>(`/api/signers/${id}`);

/* Roles — บทบาทและสิทธิ์ (ตั้งค่าระบบ); not in the handoff; names are ours. */

export const getRolesApi = (params?: Record<string, unknown>) =>
  mainClient.get<PagedResponse<RoleResponse>>("/api/roles", { params });

export const getRoleApi = (id: string) =>
  mainClient.get<ApiResponse<RoleResponse>>(`/api/roles/${id}`);

export const createRoleApi = (body: RoleRequest) =>
  mainClient.post<ApiResponse<RoleResponse>>("/api/roles", body);

export const updateRoleApi = (id: string, body: RoleRequest) =>
  mainClient.put<ApiResponse<RoleResponse>>(`/api/roles/${id}`, body);

export const deleteRoleApi = (id: string) =>
  mainClient.delete<ApiResponse<null>>(`/api/roles/${id}`);

/* Master data — option lists the backend owns; not in the handoff; names are ours. */

const getMasterApi = (path: string, params?: Record<string, unknown>) =>
  mainClient.get<ApiResponse<MasterOptionResponse[]>>(`/api/master/${path}`, {
    params,
  });

export const getApplicationTypesApi = () => getMasterApi("application-types");

export const getDecisionReasonsApi = (action: DecisionRequest["action"]) =>
  getMasterApi("decision-reasons", { action });

export const getWeaponCategoriesApi = () => getMasterApi("weapon-categories");

export const getPersonTypesApi = () => getMasterApi("person-types");

export const getPrefixesApi = () => getMasterApi("prefixes");
