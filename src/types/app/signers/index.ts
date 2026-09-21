/**
 * Signing constants shared by ผู้ใช้งาน (a user's signing data) and
 * กระบวนการลงนาม. There is no separate signer record any more: a signer is a
 * user with an approval level — see types/app/users.
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

export interface CertificateCheckResult {
  valid: boolean;
  /** why it failed, when the checker can tell PIN from file */
  reason?: "PIN" | "FILE";
  /** the certificate's subject (holder) name when valid */
  subject?: string;
  /** ISO date the certificate expires when valid */
  validTo?: string;
}
