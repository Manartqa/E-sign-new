import type { PagedResponse, ApiResponse } from "@/types/api/main/common";
import type {
  ApplicationResponse,
  ApplicationDetailResponse,
  ApproveRequest,
  SignRequest,
} from "@/types/api/main/application";
import type { UserResponse } from "@/types/api/main/user";
import type { ReportSummaryResponse } from "@/types/api/main/report";
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

export const approveApplicationApi = (id: string, body: ApproveRequest) =>
  mainClient.patch<ApiResponse<ApplicationDetailResponse>>(
    `/api/applications/${id}/approve`,
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

export const getProfileApi = () =>
  mainClient.get<ApiResponse<UserResponse>>("/api/me");
