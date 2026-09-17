import type { UserProfile } from "@/types/app/profile";

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
