import type { SignMethod } from "@/types/api/main/application";
import { SIGNING_METHOD, type SigningMethod } from "@/types/app/signers";

/**
 * How the officer approves a request. Earlier signers (ผู้ตรวจสอบ) confirm
 * with the button; the final signer makes the digital signature by their own
 * วิธีลงลายเซ็นต์ — USB token on this PC, or the certificate the server holds.
 * null: a final signer whose method can't sign here (not set, or E_DOCUMENT),
 * so the approval must not be offered.
 */
export function signMethodFor(
  isFinalSigner: boolean,
  signingMethod: SigningMethod | null | undefined,
): SignMethod | null {
  if (!isFinalSigner) return "CONFIRM";
  if (signingMethod === SIGNING_METHOD.USB_TOKEN) return "USB_TOKEN";
  if (signingMethod === SIGNING_METHOD.CERTIFICATE_FILE) return "CERTIFICATE_FILE";
  return null;
}
