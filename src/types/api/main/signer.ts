import type { CertificateCheckResult } from "@/types/app/signers";

/** POST /api/users/certificate-check — opens the file with the PIN, saves neither */
export type CertificateCheckResponse = CertificateCheckResult;
