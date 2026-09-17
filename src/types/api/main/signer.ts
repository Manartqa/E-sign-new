import type {
  CertificateCheckResult,
  Signer,
} from "@/types/app/signers";

/**
 * /api/signers — not in the handoff; mirrors the settings screens until the
 * backend defines its own contract.
 * - create / update take multipart/form-data (certificate file, signature
 *   image), built in signer.service.ts
 * - deleting a signer that a workflow still uses is expected to answer 409
 */
export type SignerResponse = Signer;
export type CertificateCheckResponse = CertificateCheckResult;
