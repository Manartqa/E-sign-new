import { USE_MOCK } from "@/lib/env";
import { prepareSignApi } from "@/lib/api/api-main";
import { isVersionAtLeast } from "@/lib/version";
import {
  SIGNING_AGENT_LAUNCH_URL,
  SIGNING_AGENT_MIN_VERSION,
  SIGNING_AGENT_URL,
} from "@/constant/signingAgent";
import {
  MOCK_AGENT_OLD_VERSION,
  MOCK_AGENT_VERSION,
  MOCK_SIGNING_TOKEN,
  MOCK_TOKEN_PIN,
  readMockAgentScenario,
} from "@/mocks/signingToken.mock";
import type {
  AgentCertificate,
  AgentErrorResponse,
  AgentSignRequest,
  AgentSignResponse,
  AgentStatusResponse,
} from "@/types/api/signingAgent";
import type {
  SigningAgentState,
  SigningToken,
  TokenSignResult,
} from "@/types/app/signing";

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * A browser cannot reach a USB PKI token by itself, so the real branch talks
 * to the local signing agent on the officer's PC (SIGNING-AGENT.md), which
 * signs through the SafeNet driver. The agent is installed the first time a
 * signature needs it — see SigningAgentSetup.
 */
const AGENT_NOT_CONNECTED =
  "ติดต่อโปรแกรมลงนามบนเครื่องนี้ไม่ได้ กรุณาตรวจสอบว่าโปรแกรมเปิดอยู่";

const AGENT_ERROR_MESSAGES: Record<NonNullable<AgentErrorResponse["code"]>, string> = {
  TOKEN_NOT_PRESENT: "ไม่พบ USB Token กรุณาเสียบ Token แล้วกดตรวจหาอีกครั้ง",
  PIN_INCORRECT: "รหัส PIN ไม่ถูกต้อง",
  PIN_LOCKED:
    "USB Token ถูกล็อกเพราะกรอก PIN ผิดเกินจำนวนครั้ง กรุณาปลดล็อกด้วย SafeNet Authentication Client หรือติดต่อผู้ดูแลระบบ",
  CERTIFICATE_NOT_FOUND: "ไม่พบใบรับรองสำหรับลงนามใน USB Token นี้",
  DRIVER_MISSING: "ไม่พบไดรเวอร์ SafeNet บนเครื่องนี้ กรุณาติดต่อผู้ดูแลเครื่อง",
  ORIGIN_NOT_ALLOWED: "โปรแกรมลงนามไม่อนุญาตให้เว็บไซต์นี้ใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
};

/** the agent's message for a failed call, in Thai */
function agentErrorMessage(body: AgentErrorResponse): string {
  const known = body.code ? AGENT_ERROR_MESSAGES[body.code] : undefined;
  if (body.code === "PIN_INCORRECT" && typeof body.retriesLeft === "number")
    return `${known} (กรอกผิดได้อีก ${body.retriesLeft} ครั้ง)`;
  return known ?? body.message ?? "โปรแกรมลงนามทำงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

async function callAgent<T>(
  path: string,
  { timeoutMs, ...init }: RequestInit & { timeoutMs: number },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SIGNING_AGENT_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error(AGENT_NOT_CONNECTED);
  }
  const body = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new Error(agentErrorMessage(body as AgentErrorResponse));
  return body as T;
}

/** stands in for the hardware round-trip so the waiting states are visible */
const tokenDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Is the agent installed, running, recent enough and able to reach the driver? */
export async function detectSigningAgent(): Promise<SigningAgentState> {
  if (USE_MOCK) {
    await tokenDelay(300);
    switch (readMockAgentScenario()) {
      case "missing":
        return { status: "missing" };
      case "outdated":
        return { status: "outdated", version: MOCK_AGENT_OLD_VERSION };
      case "noDriver":
        return { status: "noDriver", version: MOCK_AGENT_VERSION };
      default:
        return { status: "ready", version: MOCK_AGENT_VERSION };
    }
  }

  let status: AgentStatusResponse;
  try {
    // short: an agent that isn't there must not hold the dialog up
    status = await callAgent<AgentStatusResponse>("/status", { timeoutMs: 1500 });
  } catch {
    return { status: "missing" };
  }
  if (!isVersionAtLeast(status.version, SIGNING_AGENT_MIN_VERSION))
    return { status: "outdated", version: status.version };
  if (!status.driverInstalled) return { status: "noDriver", version: status.version };
  return { status: "ready", version: status.version };
}

/**
 * Starts an installed agent that isn't running, through the URL scheme its
 * installer registers. Nothing happens when it isn't installed.
 */
export function launchSigningAgent() {
  if (USE_MOCK) return;
  const link = document.createElement("a");
  link.href = SIGNING_AGENT_LAUNCH_URL;
  link.click();
}

const toSigningToken = (cert: AgentCertificate): SigningToken => ({
  label: cert.tokenLabel,
  certificateId: cert.id,
  certificateOwner: cert.subject,
  issuer: cert.issuer,
  validTo: cert.validTo,
});

/** Resolves with the plugged-in token, or rejects with a message to show. */
export async function detectSigningToken(): Promise<SigningToken> {
  if (USE_MOCK) {
    await tokenDelay(800);
    return MOCK_SIGNING_TOKEN;
  }
  const certificates = await callAgent<AgentCertificate[]>("/certificates", {
    timeoutMs: 10_000,
  });
  // the first one still valid — a token normally carries one signing cert
  const cert =
    certificates.find((item) => new Date(item.validTo).getTime() > Date.now()) ??
    certificates[0];
  if (!cert) throw new Error(AGENT_ERROR_MESSAGES.TOKEN_NOT_PRESENT);
  return toSigningToken(cert);
}

/**
 * The backend hands over the digest of the PDF to sign, the agent signs it on
 * the token with the PIN, and the CMS signature goes back through POST .../sign.
 */
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

  const token = await detectSigningToken();
  const prepared = (await prepareSignApi(body.applicationId)).data.data;
  const request: AgentSignRequest = {
    certificateId: token.certificateId,
    pin: body.pin,
    digest: prepared.digest,
    digestAlgorithm: prepared.digestAlgorithm,
  };
  const { signature } = await callAgent<AgentSignResponse>("/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    // the token can be slow, and some drivers pop their own prompt
    timeoutMs: 60_000,
  });
  return {
    certificateId: token.certificateId,
    certificateOwner: token.certificateOwner,
    signature,
  };
}
