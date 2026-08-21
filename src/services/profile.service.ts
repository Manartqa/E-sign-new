import { USE_MOCK } from "@/lib/env";
import { getProfileApi, updateProfileApi } from "@/lib/api/api-main";
import { MOCK_PROFILE } from "@/mocks/profile.mock";
import type { UserProfile } from "@/types/app/profile";

/**
 * The in-memory MOCK_PROFILE mutation below only lasts for the current page
 * load — a refresh re-evaluates the module and loses it. Mirroring that in
 * localStorage lets an edited profile survive a reload too, same as a real
 * PATCH would.
 */
const MOCK_OVERRIDES_KEY = "profile-mock-overrides";

function readMockOverrides(): Partial<UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MOCK_OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Partial<UserProfile>) : {};
  } catch {
    return {};
  }
}

function writeMockOverrides(data: Partial<UserProfile>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      MOCK_OVERRIDES_KEY,
      JSON.stringify({ ...readMockOverrides(), ...data }),
    );
  } catch {
    // quota exceeded (e.g. a large avatar image) — the in-memory mutation
    // still covers the rest of this session, so just skip the reload-proofing
  }
}

export async function getProfile(): Promise<UserProfile> {
  if (USE_MOCK) return { ...MOCK_PROFILE, ...readMockOverrides() };
  const res = await getProfileApi();
  return res.data.data;
}

export async function updateProfile(
  data: Partial<UserProfile>,
): Promise<UserProfile> {
  if (USE_MOCK) {
    // mutated in place so the next getProfile() (e.g. the invalidated
    // refetch after this mutation) reflects the edit instead of reverting
    // to the static mock — mirrors how a real PATCH would persist it
    Object.assign(MOCK_PROFILE, data);
    writeMockOverrides(data);
    return MOCK_PROFILE;
  }
  const res = await updateProfileApi(data);
  return res.data.data;
}
