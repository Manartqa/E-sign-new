import { MOCK_FINAL_SIGNER_PROFILE, MOCK_PROFILE } from "./profile.mock";
import type { UserProfile } from "@/types/app/profile";

/**
 * The accounts the mock backend accepts. Anything else is rejected, so the
 * login form's error state is reachable without a real backend. There is no
 * role gating anywhere in the app yet, so both accounts reach every screen;
 * they differ only in the queue they see and in whether their signature needs
 * the USB token.
 */
export const MOCK_ACCOUNTS: { pwd: string; profile: UserProfile }[] = [
  { pwd: "P@ssw0rd", profile: MOCK_PROFILE },
  { pwd: "P@ssw0rd", profile: MOCK_FINAL_SIGNER_PROFILE },
];

export const findMockAccount = (username: string) =>
  MOCK_ACCOUNTS.find(
    (account) => account.profile.username === username.trim().toLowerCase(),
  );

/** the account the password-change mock starts from */
export const MOCK_CREDENTIALS = {
  username: MOCK_PROFILE.username,
  pwd: MOCK_ACCOUNTS[0].pwd,
} as const;
