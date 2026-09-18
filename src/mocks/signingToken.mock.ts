import { MOCK_FINAL_SIGNER_PROFILE } from "./profile.mock";
import type { SigningToken } from "@/types/app/signing";

/** the token belongs to the officer who signs last — the only one who uses it */
export const MOCK_SIGNING_TOKEN: SigningToken = {
  label: "SafeNet eToken 5110",
  certificateId: "CERT-TOKEN-2026-0417",
  certificateOwner: MOCK_FINAL_SIGNER_PROFILE.name,
  issuer: "สำนักงาน PKI รัฐบาล",
  validTo: "2027-12-31T00:00:00Z",
};

/** The only PIN the mock token accepts — anything else shows the wrong-PIN error. */
export const MOCK_TOKEN_PIN = "123456";
