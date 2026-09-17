/** A USB signing token found by the local signing agent. */
export interface SigningToken {
  /** device label shown to the officer, e.g. "SafeNet eToken 5110" */
  label: string;
  certificateId: string;
  /** subject of the certificate on the token */
  certificateOwner: string;
  issuer: string;
  /** ISO */
  validTo: string;
}

/** What the token hands back after signing — fed into POST .../sign. */
export interface TokenSignResult {
  certificateId: string;
  certificateOwner: string;
  signature: string;
}
