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

/**
 * Which signing-agent situation the mock plays, from localStorage so a
 * developer or an e2e test can walk the setup steps: set it to "missing",
 * open the dialog, then flip it to "ready" as if the installer had run.
 * Anything else (or no storage) = a ready agent, so the normal flow is the default.
 */
export const MOCK_AGENT_STORAGE_KEY = "mock-signing-agent";
export const MOCK_AGENT_VERSION = "1.2.0";
export const MOCK_AGENT_OLD_VERSION = "0.9.0";

export type MockAgentScenario = "ready" | "missing" | "outdated" | "noDriver";

export function readMockAgentScenario(): MockAgentScenario {
  try {
    const value = localStorage.getItem(MOCK_AGENT_STORAGE_KEY);
    return value === "missing" || value === "outdated" || value === "noDriver"
      ? value
      : "ready";
  } catch {
    return "ready";
  }
}
