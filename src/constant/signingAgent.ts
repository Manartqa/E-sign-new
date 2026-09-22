import { PUBLIC_BASE_PATH } from "@/constant/sso";

/**
 * The local signing agent: a small program on the officer's PC that reaches
 * the USB token (SafeNet, through PKCS#11) for the browser, which can't. It is
 * installed the first time a signature needs it. Contract: SIGNING-AGENT.md.
 *
 * http://127.0.0.1, not https: browsers treat loopback as a secure origin, so
 * an https page may call it without installing a localhost certificate.
 */
export const SIGNING_AGENT_URL = (
  process.env.NEXT_PUBLIC_SIGNING_AGENT_URL || "http://127.0.0.1:47125"
).replace(/\/+$/, "");

/** where the one-time installer (and its updates) is downloaded from */
export const SIGNING_AGENT_INSTALLER_URL =
  process.env.NEXT_PUBLIC_SIGNING_AGENT_INSTALLER_URL ||
  `${PUBLIC_BASE_PATH}/downloads/esign-agent-setup.exe`;

/** older agents are asked to update before they may sign — 1.1.0 sends the certificate's email */
export const SIGNING_AGENT_MIN_VERSION =
  process.env.NEXT_PUBLIC_SIGNING_AGENT_MIN_VERSION || "1.1.0";

/** registered by the installer; starts an installed agent that isn't running */
export const SIGNING_AGENT_LAUNCH_URL = "esign-agent://start";

/** how often a missing / outdated agent is looked for again while the dialog is open */
export const SIGNING_AGENT_POLL_MS = 2000;
