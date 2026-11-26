import type { SortParams } from "@/types/app/common";
/**
 * ตั้งค่าระบบ › กระบวนการลงนาม — not in Figma or the handoff. Fields follow the
 * legacy system's list screen. `steps` are the workflow's signers in signing
 * order: the form seeds that order from each signer's ระดับการอนุมัติ, and the
 * user is free to rearrange it by hand.
 */

export const REQUEST_USAGE = {
  NEW_AND_RENEW: "NEW_AND_RENEW",
  NEW: "NEW",
  RENEW: "RENEW",
} as const;
export type RequestUsage = (typeof REQUEST_USAGE)[keyof typeof REQUEST_USAGE];

export const REPLACEMENT_USAGE = {
  NORMAL_AND_REPLACEMENT: "NORMAL_AND_REPLACEMENT",
  NORMAL: "NORMAL",
  REPLACEMENT: "REPLACEMENT",
} as const;
export type ReplacementUsage =
  (typeof REPLACEMENT_USAGE)[keyof typeof REPLACEMENT_USAGE];

export interface SigningWorkflowStep {
  id: string;
  /** the ผู้มีอำนาจลงนาม (Signer) chosen for this step; "" until picked */
  signerId: string;
  /** the signer's ชื่อ-นามสกุล — read-only, resolved from signerId on read */
  signerName: string;
  /** the signer's ตำแหน่ง — read-only, resolved from signerId on read */
  position: string;
  /** the signer's ระดับการอนุมัติ — read-only, resolved from signerId on read */
  approvalLevel: string;
  /**
   * whether the signer's account is still ใช้งาน — read-only, resolved on
   * read. A step whose signer was switched off is flagged on the form; the
   * workflow still saves (user's call, 2026-11-26).
   */
  signerActive: boolean;
}

export interface SigningWorkflow {
  id: string;
  /** ชื่อกระบวนการอนุมัติ */
  name: string;
  /** ประเภทยุทธภัณฑ์ — "all" = ทุกประเภทยุทธภัณฑ์ */
  weaponCategory: string;
  /** ประเภทใบอนุญาต — an application `type`, or "all" */
  licenseType: string;
  /** การใช้กับคำขอใหม่หรือต่ออายุ */
  requestUsage: RequestUsage;
  /** การใช้กับคำขอใบแทน */
  replacementUsage: ReplacementUsage;
  /**
   * each signer once, in signing order; the last is the one
   * ผู้ตรวจสอบและลงนาม (REVIEW_AND_SIGN) who issues the licence
   */
  steps: SigningWorkflowStep[];
  /** ใช้งาน — legacy IS_ACTIVE; an inactive workflow is not picked for new requests */
  isActive: boolean;
  /** หมายเหตุ — legacy NOTE1, max 512 */
  note: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/** what the add / edit form submits */
export type SigningWorkflowInput = Pick<
  SigningWorkflow,
  | "name"
  | "weaponCategory"
  | "licenseType"
  | "requestUsage"
  | "replacementUsage"
  | "steps"
  | "isActive"
  | "note"
>;

/** thrown by deleteSigningWorkflow when requests still run on the workflow */
export class WorkflowInUseError extends Error {
  constructor(message = "กระบวนการลงนามนี้ยังมีคำขอที่อยู่ระหว่างการลงนาม จึงลบไม่ได้") {
    super(message);
  }
}

export interface SigningWorkflowListParams extends SortParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface SigningWorkflowListResult {
  items: SigningWorkflow[];
  total: number;
  page: number;
  limit: number;
}
