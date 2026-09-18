/**
 * ตั้งค่าระบบ › ผู้มีอำนาจลงนาม — not in Figma or the handoff. Fields follow the
 * legacy ผู้ตรวจสอบ list and add / edit screens. Signing workflow steps pick
 * their signer from this list.
 */

export const SIGNING_METHOD = {
  USB_TOKEN: "USB_TOKEN",
  CERTIFICATE_FILE: "CERTIFICATE_FILE",
  E_DOCUMENT: "E_DOCUMENT",
} as const;
export type SigningMethod = (typeof SIGNING_METHOD)[keyof typeof SIGNING_METHOD];

/** ระดับการอนุมัติ: "1"–"19" (ผู้ตรวจสอบ n), then the final signing level */
export const APPROVAL_LEVEL_FINAL = "REVIEW_AND_SIGN";

/** sort key for a level — workflows always run in this order; "" sorts last */
export function approvalLevelRank(level: string): number {
  if (level === APPROVAL_LEVEL_FINAL) return 100;
  return level ? Number(level) : Number.POSITIVE_INFINITY;
}

export interface Signer {
  id: string;
  /** ประเภทบุคคล */
  personType: string;
  /** ระดับการอนุมัติ — "" when not set, which keeps the signer out of workflows */
  approvalLevel: string;
  /** ใช้งาน — only active signers can be picked into a workflow */
  isActive: boolean;
  /** คำนำหน้าชื่อ — e.g. "พล.ต." */
  prefix: string;
  firstName: string;
  lastName: string;
  /** display name — `${prefix}${firstName} ${lastName}`, composed by the server */
  name: string;
  /** เลขที่บัตรประชาชน — 13 digits, or "" */
  nationalId: string;
  email: string;
  /** ตำแหน่ง — may be empty; some legacy rows have none */
  position: string;
  /** หมายเหตุ */
  note: string;
  /** วิธีลงลายเซ็นต์ */
  signingMethod: SigningMethod;
  /** the uploaded certificate's file name; null when none (never the file or PIN) */
  certificateFileName: string | null;
  /** รูปลายเซ็นต์ */
  signatureImageUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/** what the add / edit form submits (sent as multipart/form-data) */
export interface SignerInput
  extends Pick<
    Signer,
    | "personType"
    | "approvalLevel"
    | "isActive"
    | "prefix"
    | "firstName"
    | "lastName"
    | "nationalId"
    | "email"
    | "position"
    | "note"
    | "signingMethod"
  > {
  /** a new certificate and its PIN; omit to keep the current one */
  certificate?: { file: File; pin: string };
  /** a new image, or null to remove the current one; omit to keep it */
  signatureImage?: File | null;
}

export interface CertificateCheckResult {
  valid: boolean;
  /** why it failed, when the checker can tell PIN from file */
  reason?: "PIN" | "FILE";
  /** the certificate's subject (holder) name when valid */
  subject?: string;
  /** ISO date the certificate expires when valid */
  validTo?: string;
}

export interface SignerListParams {
  keyword?: string;
  /** only signers marked ใช้งาน */
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface SignerListResult {
  items: Signer[];
  total: number;
  page: number;
  limit: number;
}

/** thrown by deleteSigner when a signing workflow still uses the signer */
export class SignerInUseError extends Error {
  constructor() {
    super("ผู้มีอำนาจลงนามนี้ถูกใช้อยู่ในกระบวนการลงนาม");
  }
}
