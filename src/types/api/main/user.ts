import type { UserProfile } from "@/types/app/profile";

/**
 * GET /api/me — the handoff does not describe this body either; it mirrors
 * what the profile page renders (Figma app-Profile 116:1831).
 */
export type UserResponse = UserProfile;

export interface LoginRequest {
  username: string;
  pwd: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}
