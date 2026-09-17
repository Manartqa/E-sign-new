import type { SigningToken } from "@/types/app/signing";

export const MOCK_SIGNING_TOKEN: SigningToken = {
  label: "SafeNet eToken 5110",
  certificateId: "CERT-TOKEN-2026-0417",
  certificateOwner: "นายมานัส ประทุมชู",
  issuer: "สำนักงาน PKI รัฐบาล",
  validTo: "2027-12-31T00:00:00Z",
};

/** The only PIN the mock token accepts — anything else shows the wrong-PIN error. */
export const MOCK_TOKEN_PIN = "123456";
