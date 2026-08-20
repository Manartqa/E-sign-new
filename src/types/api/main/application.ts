import type { ApplicationStatus } from "@/constant/status";
import type {
  ApplicationSummary,
  DetailPanel,
  DetailTabKey,
} from "@/types/app/applications";

export interface ApplicantResponse {
  name: string;
  nationalId: string;
}

/** One row of GET /api/applications */
export interface ApplicationResponse {
  id: string;
  type: string;
  typeName: string;
  /** columns present in the Figma table but absent from the handoff sample */
  requestNo: string;
  receiptNo: string;
  receivedAt: string;
  operatorName: string;
  applicant: ApplicantResponse;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  assignedOfficer: string;
}

/**
 * GET /api/applications/:id
 *
 * The detail body is not described by the handoff at all — the shape below
 * mirrors what the Figma tab panels actually render (106:7034). Expect to
 * revisit it when the real endpoint exists.
 */
export interface ApplicationDetailResponse extends ApplicationResponse {
  summary: ApplicationSummary;
  panels: Record<DetailTabKey, DetailPanel>;
}

export interface ApproveRequest {
  notes: string;
  officerId: string;
}

export interface SignRequest {
  certificateId: string;
  certificateOwner: string;
  signature: string;
  timestamp: string;
  applicationId: string;
  officerId: string;
  notes: string;
}
