import type { ApplicationStatus } from "@/constant/status";
import type {
  ApplicationStats,
  ApplicationSummary,
  DecisionAction,
  DetailPanel,
  DetailTabKey,
  MyStep,
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
  /** the caller's own step — see ApplicationItem.myStep */
  myStep: MyStep | null;
  /** backend-decided — see ApplicationItem.canAct */
  canAct: boolean;
  /** ส่งไปยัง/ขายให้กับ, null when the request type has none */
  buyerName: string | null;
  /** วันที่คำขอ */
  documentDate: string;
  /** หมายเหตุด่วน, null when not ด่วน */
  urgentRemark: string | null;
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

/**
 * How an approval is made:
 * - CONFIRM — an earlier signer (ผู้ตรวจสอบ) approves with the button; no
 *   digital signature is made.
 * - USB_TOKEN — the final signer's token signed `signature` on this PC.
 * - CERTIFICATE_FILE — the final signer's certificate is held by the server,
 *   which signs; the body carries no signature.
 * The backend checks the method against the signer's ระดับการอนุมัติ and
 * วิธีลงลายเซ็นต์ and refuses a mismatch.
 */
export type SignMethod = "CONFIRM" | "USB_TOKEN" | "CERTIFICATE_FILE";

export interface SignRequest {
  method: SignMethod;
  certificateId: string;
  certificateOwner: string;
  signature: string;
  timestamp: string;
  applicationId: string;
  officerId: string;
  /** หมายเหตุ, optional on approval (legacy max 512) */
  notes: string;
}

/**
 * One row's outcome of a batch action. Contract for the batch endpoints
 * (POST /api/applications/bulk/decision, POST /api/applications/bulk/sign),
 * which do not exist yet — until they do, useBulkApplicationActions calls
 * the per-request endpoints and builds the same shape itself.
 */
export interface BulkRowResult {
  id: string;
  ok: boolean;
  /** why the row failed, ready to show — e.g. "รายการนี้ลงนามแล้ว หรือยังไม่ถึงลำดับการลงนาม" */
  message?: string;
}
