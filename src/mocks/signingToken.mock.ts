import { MOCK_FINAL_SIGNER_PROFILE } from "./profile.mock";
import type { SigningToken } from "@/types/app/signing";

/** the token belongs to the officer who signs last — the only one who uses it */
export const MOCK_SIGNING_TOKEN: SigningToken = {
  label: "SafeNet eToken 5110",
  certificateId: "CERT-TOKEN-2026-0417",
  certificateOwner: MOCK_FINAL_SIGNER_PROFILE.name,
  email: MOCK_FINAL_SIGNER_PROFILE.email,
  issuer: "สำนักงาน PKI รัฐบาล",
  validTo: "2027-12-31T00:00:00Z",
};

/** The only PIN the mock token accepts — anything else shows the wrong-PIN error. */
export const MOCK_TOKEN_PIN = "123456";

/** the "wrongOwner" scenario's token: someone else's certificate */
export const MOCK_OTHER_SIGNING_TOKEN: SigningToken = {
  ...MOCK_SIGNING_TOKEN,
  certificateId: "CERT-TOKEN-2026-0999",
  certificateOwner: "นายสมชาย ใจดี",
  email: "somchai.ja@smartalliance.co.th",
};

/**
 * Which signing-agent situation the mock plays, from localStorage so a
 * developer or an e2e test can walk the setup steps: set it to "missing",
 * open the dialog, then flip it to "ready" as if the installer had run.
 * Unset (or no storage) = null: the real agent and USB token, even on the mock
 * backend, so a token can be tried on a dev PC. Only read while USE_MOCK.
 */
export const MOCK_AGENT_STORAGE_KEY = "mock-signing-agent";
export const MOCK_AGENT_VERSION = "1.2.0";
export const MOCK_AGENT_OLD_VERSION = "0.9.0";

export type MockAgentScenario =
  | "ready"
  | "missing"
  | "notRunning"
  | "outdated"
  | "noDriver"
  /** a ready agent with someone else's token plugged in */
  | "wrongOwner";

const MOCK_AGENT_SCENARIOS: MockAgentScenario[] = [
  "ready",
  "missing",
  "notRunning",
  "outdated",
  "noDriver",
  "wrongOwner",
];

export function readMockAgentScenario(): MockAgentScenario | null {
  try {
    const value = localStorage.getItem(MOCK_AGENT_STORAGE_KEY);
    return MOCK_AGENT_SCENARIOS.find((scenario) => scenario === value) ?? null;
  } catch {
    return null;
  }
}
