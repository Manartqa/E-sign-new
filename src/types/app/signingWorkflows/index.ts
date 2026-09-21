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
  /** each signer once, in signing order */
  steps: SigningWorkflowStep[];
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
>;

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
