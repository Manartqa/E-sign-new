import type { ApplicationStatus } from "@/constant/status";
import type {
  ApplicationStats,
  ApplicationSummary,
  DecisionAction,
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
  /** not in the handoff — see ApplicationItem.isFinalSigner */
  isFinalSigner: boolean;
  /**
   * ด่วน, decided by the originating system. The list endpoint must also
   * order urgent rows first, before paging — see ApplicationItem.isUrgent.
   */
  isUrgent: boolean;
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
  /** keyed by DETAIL_TABS; a tab the request has no data for is left out */
  panels: Partial<Record<DetailTabKey, DetailPanel>>;
}

/**
 * PATCH /api/applications/:id/decision — not in the handoff. The officer is
 * taken from the token, never from the body.
 */
export interface DecisionRequest {
  action: DecisionAction;
  reasonCode: string;
  notes: string;
}

/** GET /api/applications/stats — scoped to the caller like the list */
export type ApplicationStatsResponse = ApplicationStats;

/**
 * POST /api/applications/:id/sign/prepare — what the USB token must sign: the
 * digest of the PDF's signed byte range, never the file itself. Not in the
 * handoff; names are ours (see SIGNING-AGENT.md).
 */
export interface SignPrepareResponse {
  /** base64 */
  digest: string;
  /** only SHA-256 so far */
  digestAlgorithm: "SHA256";
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
