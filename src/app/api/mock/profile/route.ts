import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { USE_MOCK } from "@/lib/env";
import { MOCK_PROFILE } from "@/mocks/profile.mock";
import type { UserProfile } from "@/types/app/profile";

/**
 * Mock stand-in for GET|PATCH /api/me while NEXT_PUBLIC_USE_MOCK is on.
 *
 * Profile edits (including the avatar data URL) used to live in the browser's
 * localStorage, so a photo set on the desktop never reached a phone opening the
 * same dev server over the LAN. Keeping them in a file on the dev machine gives
 * every device the same profile, the way a real backend would.
 */
const STORE = path.join(process.cwd(), ".mock-data", "profile.json");

async function readOverrides(): Promise<Partial<UserProfile>> {
  try {
    return JSON.parse(await readFile(STORE, "utf8")) as Partial<UserProfile>;
  } catch {
    return {}; // nothing saved yet
  }
}

const notFound = () => new Response(null, { status: 404 });

export async function GET() {
  if (!USE_MOCK) return notFound();
  return Response.json({ ...MOCK_PROFILE, ...(await readOverrides()) });
}

export async function PATCH(request: Request) {
  if (!USE_MOCK) return notFound();
  const overrides = {
    ...(await readOverrides()),
    ...((await request.json()) as Partial<UserProfile>),
  };
  await mkdir(path.dirname(STORE), { recursive: true });
  await writeFile(STORE, JSON.stringify(overrides));
  return Response.json({ ...MOCK_PROFILE, ...overrides });
}
