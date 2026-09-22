/** A USB signing token found by the local signing agent. */
export interface SigningToken {
  /** device label shown to the officer, e.g. "SafeNet eToken 5110" */
  label: string;
  certificateId: string;
  /** subject of the certificate on the token */
  certificateOwner: string;
  /** must be the signed-in user's email, or the token may not sign */
  email: string;
  issuer: string;
  /** ISO */
  validTo: string;
}

/**
 * Where the local signing agent stands on this PC. Only `ready` may go on to
 * the token; the rest are shown as a setup step inside the signing dialog.
 */
export type SigningAgentState =
  | { status: "ready"; version: string }
  /** never seen from this browser — presumably not installed */
  | { status: "missing" }
  /** seen from this browser before, so installed, but not answering now */
  | { status: "notRunning" }
  /** installed, but older than SIGNING_AGENT_MIN_VERSION */
  | { status: "outdated"; version: string }
  /** the agent runs, but the SafeNet driver (PKCS#11 library) isn't there */
  | { status: "noDriver"; version: string };

/** What the token hands back after signing — fed into POST .../sign. */
export interface TokenSignResult {
  certificateId: string;
  certificateOwner: string;
  signature: string;
}
