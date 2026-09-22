import { MOCK_FINAL_SIGNER_PROFILE, MOCK_PROFILE } from "./profile.mock";
import { MOCK_ROLES } from "./roles.mock";
import { MOCK_USERS, type MockUser } from "./users.mock";
import type { UserProfile } from "@/types/app/profile";
import type { Role } from "@/types/app/roles";

/**
 * The accounts the mock backend accepts. Anything else is rejected, so the
 * login form's error state is reachable without a real backend. The first two
 * differ in their roles, the queue they see and whether their signature needs
 * the USB token; the third is turned away by `canSignIn`.
 */
export const MOCK_ACCOUNTS: { pwd: string; profile: UserProfile }[] = [
  { pwd: "P@ssw0rd", profile: MOCK_PROFILE },
  { pwd: "P@ssw0rd", profile: MOCK_FINAL_SIGNER_PROFILE },
  // right password, but no ผู้ใช้งาน record — shows the access-denied path
  {
    pwd: "P@ssw0rd",
    profile: {
      ...MOCK_PROFILE,
      id: "OFF-900",
      prefix: "นาย",
      firstName: "ทดสอบ",
      lastName: "ไม่มีสิทธิ์",
      name: "นายทดสอบ ไม่มีสิทธิ์",
      email: "no.access@smartalliance.co.th",
      username: "no.access@smartalliance.co.th",
      roles: [],
      permissions: [],
    },
  },
];

/**
 * Who may sign in with a password: a ผู้ใช้งาน record for the e-mail that is
 * active and holds at least one active role (any SSO account may sign in). The real backend enforces the
 * same rule; this mirrors it for the mock. On the server it reads the seed
 * lists — edits made on the settings pages live in the browser only.
 */
export function canSignIn(
  email: string | null | undefined,
  users: MockUser[] = MOCK_USERS,
  roles: Role[] = MOCK_ROLES,
): boolean {
  const user = email
    ? users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
    : undefined;
  if (!user?.isActive) return false;
  return roles.some((role) => role.isActive && user.roleIds.includes(role.id));
}

export const findMockAccount = (username: string) =>
  MOCK_ACCOUNTS.find(
    (account) => account.profile.username === username.trim().toLowerCase(),
  );

/** the account the password-change mock starts from */
export const MOCK_CREDENTIALS = {
  username: MOCK_PROFILE.username,
  pwd: MOCK_ACCOUNTS[0].pwd,
} as const;
