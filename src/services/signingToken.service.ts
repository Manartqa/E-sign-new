import { USE_MOCK } from "@/lib/env";
import { MOCK_SIGNING_TOKEN, MOCK_TOKEN_PIN } from "@/mocks/signingToken.mock";
import type { SigningToken, TokenSignResult } from "@/types/app/signing";

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * A browser cannot reach a USB PKI token by itself: the real branch has to
 * talk to a signing agent installed on the officer's machine (typically a
 * localhost service or browser extension wrapping PKCS#11). Which agent the
 * project uses is not decided yet, so the real branch only reports that.
 */
const AGENT_NOT_CONNECTED =
  "ยังไม่ได้เชื่อมต่อโปรแกรมลงนามด้วย USB Token บนเครื่องนี้";

/** stands in for the hardware round-trip so the waiting states are visible */
const tokenDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Resolves with the plugged-in token, or rejects with a message to show. */
export async function detectSigningToken(): Promise<SigningToken> {
  if (USE_MOCK) {
    await tokenDelay(800);
    return MOCK_SIGNING_TOKEN;
  }
  throw new Error(AGENT_NOT_CONNECTED);
}

export async function signWithToken(body: {
  applicationId: string;
  pin: string;
}): Promise<TokenSignResult> {
  if (USE_MOCK) {
    await tokenDelay(1000);
    if (body.pin !== MOCK_TOKEN_PIN) throw new Error("รหัส PIN ไม่ถูกต้อง");
    return {
      certificateId: MOCK_SIGNING_TOKEN.certificateId,
      certificateOwner: MOCK_SIGNING_TOKEN.certificateOwner,
      signature: `mock-token-signature:${body.applicationId}`,
    };
  }
  throw new Error(AGENT_NOT_CONNECTED);
}
