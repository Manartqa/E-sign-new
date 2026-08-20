import { USE_MOCK } from "@/lib/env";
import { getProfileApi } from "@/lib/api/api-main";
import { MOCK_PROFILE } from "@/mocks/profile.mock";
import type { UserProfile } from "@/types/app/profile";

export async function getProfile(): Promise<UserProfile> {
  if (USE_MOCK) return MOCK_PROFILE;
  const res = await getProfileApi();
  return res.data.data;
}
