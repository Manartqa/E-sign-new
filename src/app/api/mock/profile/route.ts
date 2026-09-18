import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { USE_MOCK } from "@/lib/env";
import { MOCK_PROFILE, MOCK_PROFILES } from "@/mocks/profile.mock";
import type { UserProfile } from "@/types/app/profile";

/**
 * Mock stand-in for GET|PATCH /api/me while NEXT_PUBLIC_USE_MOCK is on.
 *
 * Profile edits (including the avatar data URL) used to live in the browser's
 * localStorage, so a photo set on the desktop never reached a phone opening the
 * same dev server over the LAN. Keeping them in a file on the dev machine gives
 * every device the same profile, the way a real backend would. Edits are kept
 * per account, since the mock has more than one officer to sign in as.
 */
const STORE = path.join(process.cwd(), ".mock-data", "profile.json");

type Overrides = Record<string, Partial<UserProfile>>;

async function readOverrides(): Promise<Overrides> {
  try {
    return JSON.parse(await readFile(STORE, "utf8")) as Overrides;
  } catch {
    return {}; // nothing saved yet
  }
}

/** the signed-in officer, or the default account when there is no session */
async function currentProfile(): Promise<UserProfile> {
  const email = (await getServerSession(authOptions))?.user?.email;
  return (
    MOCK_PROFILES.find((profile) => profile.email === email) ?? MOCK_PROFILE
  );
}

const notFound = () => new Response(null, { status: 404 });

export async function GET() {
  if (!USE_MOCK) return notFound();
  const profile = await currentProfile();
  const overrides = await readOverrides();
  return Response.json({ ...profile, ...overrides[profile.id] });
}

export async function PATCH(request: Request) {
  if (!USE_MOCK) return notFound();
  const profile = await currentProfile();
  const stored = await readOverrides();
  const overrides = {
    ...stored[profile.id],
    ...((await request.json()) as Partial<UserProfile>),
  };
  await mkdir(path.dirname(STORE), { recursive: true });
  await writeFile(
    STORE,
    JSON.stringify({ ...stored, [profile.id]: overrides }),
  );
  return Response.json({ ...profile, ...overrides });
}
