import type { UserProfile } from "@/types/app/profile";
import type { User } from "@/types/app/users";

/**
 * GET /api/me — the handoff does not describe this body either; it mirrors
 * what the profile page renders (Figma app-Profile 116:1831).
 */
export type UserResponse = UserProfile;

/**
 * POST /api/me/password — not in the handoff. A wrong `currentPwd` should come
 * back as 400/422 with `{ message }`, never 401: the axios interceptor treats
 * any 401 as an expired session and logs the user out.
 */
export interface ChangePasswordRequest {
  currentPwd: string;
  newPwd: string;
}

export interface LoginRequest {
  username: string;
  pwd: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

/**
 * /api/users — ตั้งค่าระบบ › ผู้ใช้งาน; not in the handoff, names are ours.
 * - create / update take multipart/form-data (certificate file, signature
 *   image, roleIds), built in user.service.ts
 * - deleting a user that a workflow still uses is expected to answer 409
 */
export type UserAccountResponse = User;
