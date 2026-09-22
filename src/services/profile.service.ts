import axios from "axios";
import { USE_MOCK } from "@/lib/env";
import {
  changePasswordApi,
  getProfileApi,
  updateProfileApi,
} from "@/lib/api/api-main";
import { MOCK_CREDENTIALS } from "@/mocks/auth.mock";
import { rolesOf } from "@/mocks/roles.mock";
import { MOCK_USERS } from "@/mocks/users.mock";
import type { ChangePasswordRequest } from "@/types/api/main/user";
import type { UserProfile } from "@/types/app/profile";

/**
 * Mock profile lives on the dev server (app/api/mock/profile), not in this
 * browser, so an edit or avatar made on one device shows on every other one.
 */
const MOCK_PROFILE_ROUTE = "/api/mock/profile";

/**
 * Roles are assigned (ตั้งค่าระบบ › ผู้ใช้งาน) and edited (บทบาทและสิทธิ์) in
 * this browser's memory, which the dev server can't see — so the roles and
 * permissions the server sends are replaced with the ones held here.
 */
async function mockProfileRequest(init?: RequestInit): Promise<UserProfile> {
  const res = await fetch(MOCK_PROFILE_ROUTE, init);
  if (!res.ok) throw new Error(`mock profile ${res.status}`);
  const profile = (await res.json()) as UserProfile;
  // an SSO session's id is the SSO `sub`, so fall back to the e-mail
  const email = profile.email.toLowerCase();
  const user = MOCK_USERS.find(
    (item) => item.id === profile.id || (email && item.email.toLowerCase() === email),
  );
  return user ? { ...profile, ...rolesOf(user.roleIds) } : profile;
}

export async function getProfile(): Promise<UserProfile> {
  if (USE_MOCK) return mockProfileRequest();
  const res = await getProfileApi();
  return res.data.data;
}

export async function updateProfile(
  data: Partial<UserProfile>,
): Promise<UserProfile> {
  if (USE_MOCK) {
    return mockProfileRequest({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
  const res = await updateProfileApi(data);
  return res.data.data;
}

/**
 * The mock's current password. Browser-side only: sign-in is checked on the
 * server against MOCK_CREDENTIALS, so a changed password here does not change
 * what the login form accepts, and a reload resets it.
 */
let mockPassword: string = MOCK_CREDENTIALS.pwd;

const WRONG_CURRENT_PASSWORD = "รหัสผ่านปัจจุบันไม่ถูกต้อง";
const CHANGE_PASSWORD_FAILED = "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

/** Rejects with an Error whose message is ready to show the user. */
export async function changePassword(
  body: ChangePasswordRequest,
): Promise<void> {
  if (USE_MOCK) {
    if (body.currentPwd !== mockPassword) throw new Error(WRONG_CURRENT_PASSWORD);
    mockPassword = body.newPwd;
    return;
  }
  try {
    await changePasswordApi(body);
  } catch (error) {
    // prefer the backend's own reason (e.g. wrong current password, reused
    // password) over axios' English "Request failed with status code …"
    const message = axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message
      : undefined;
    throw new Error(message ?? CHANGE_PASSWORD_FAILED);
  }
}
