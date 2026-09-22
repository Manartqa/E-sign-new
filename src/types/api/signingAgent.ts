/**
 * The local signing agent's HTTP API (SIGNING-AGENT.md) — spoken to directly
 * from the browser at SIGNING_AGENT_URL, not through the main backend.
 */

/** GET /status */
export interface AgentStatusResponse {
  /** semver, e.g. "1.2.0" */
  version: string;
  /** the SafeNet PKCS#11 library (eTPKCS11.dll) was found */
  driverInstalled: boolean;
}

/** GET /certificates — one per signing certificate on the plugged-in tokens */
export interface AgentCertificate {
  id: string;
  /** token label, e.g. "SafeNet eToken 5110" */
  tokenLabel: string;
  /** certificate subject's name */
  subject: string;
  issuer: string;
  /** ISO */
  validTo: string;
}

/** POST /sign */
export interface AgentSignRequest {
  certificateId: string;
  pin: string;
  /** base64, from POST /api/applications/:id/sign/prepare */
  digest: string;
  digestAlgorithm: "SHA256";
}

export interface AgentSignResponse {
  /** base64 CMS SignedData (detached), carrying the certificate chain */
  signature: string;
}

/** any non-2xx */
export interface AgentErrorResponse {
  code?:
    | "TOKEN_NOT_PRESENT"
    | "PIN_INCORRECT"
    | "PIN_LOCKED"
    | "CERTIFICATE_NOT_FOUND"
    | "DRIVER_MISSING"
    | "ORIGIN_NOT_ALLOWED";
  message?: string;
  /** with PIN_INCORRECT, when the token reports it */
  retriesLeft?: number;
}
