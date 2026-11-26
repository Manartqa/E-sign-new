/**
 * Second step of the password sign-in: a one-time code e-mailed to the
 * account (user's call, 2026-11-26 — legacy had a dormant authenticator-app
 * MFA). SSO sign-in skips it; the SSO provider does its own checks.
 *
 * NextAuth's credentials provider can only report an error string, so the
 * steps travel as these codes in `signIn(...).error`.
 */
export const MFA_REQUIRED_ERROR = "MfaRequired";
export const MFA_INVALID_ERROR = "MfaInvalid";
export const MFA_LOCKED_ERROR = "MfaLocked";

/** wrong codes allowed before the sign-in has to start over (legacy 5) */
export const MFA_MAX_ATTEMPTS = 5;

export const OTP_LENGTH = 6;

/** "MfaRequired:m***t@agency.go.th" — the code was sent, and where */
export const mfaRequiredError = (maskedEmail: string) =>
  `${MFA_REQUIRED_ERROR}:${maskedEmail}`;

/** the masked address from an MfaRequired error, or null for any other error */
export function parseMfaRequired(error: string | null | undefined): string | null {
  if (!error?.startsWith(`${MFA_REQUIRED_ERROR}:`)) return null;
  return error.slice(MFA_REQUIRED_ERROR.length + 1);
}

/** "manart.pa@smartalliance.co.th" → "m*******a@smartalliance.co.th" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const hidden = local.length <= 2
    ? `${local[0] ?? ""}*`
    : `${local[0]}${"*".repeat(local.length - 2)}${local.at(-1)}`;
  return `${hidden}@${domain}`;
}

export const MFA_MESSAGES = {
  [MFA_INVALID_ERROR]: "รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
  [MFA_LOCKED_ERROR]: `กรอกรหัส OTP ผิดเกิน ${MFA_MAX_ATTEMPTS} ครั้ง กรุณาเข้าสู่ระบบใหม่อีกครั้ง`,
} as const;
