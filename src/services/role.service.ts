import { isAxiosError } from "axios";
import { USE_MOCK } from "@/lib/env";
import {
  createRoleApi,
  deleteRoleApi,
  getRoleApi,
  getRolesApi,
  updateRoleApi,
} from "@/lib/api/api-main";
import { MOCK_PROFILE } from "@/mocks/profile.mock";
import { MOCK_ROLES } from "@/mocks/roles.mock";
import {
  SystemRoleError,
  type Role,
  type RoleInput,
  type RoleListParams,
  type RoleListResult,
} from "@/types/app/roles";

const DEFAULT_LIMIT = 10;

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Mock branches edit MOCK_ROLES in memory: changes survive navigation but
 * reset on a page reload.
 */

export async function getRoles(
  params: RoleListParams = {},
): Promise<RoleListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;

  if (USE_MOCK) {
    const keyword = params.keyword?.trim().toLowerCase() ?? "";
    const filtered = MOCK_ROLES.filter(
      (role) =>
        !keyword ||
        role.name.toLowerCase().includes(keyword) ||
        role.description.toLowerCase().includes(keyword),
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  const res = await getRolesApi({ ...params, page, limit });
  return {
    items: res.data.data,
    total: res.data.total,
    page: res.data.page,
    limit: res.data.limit,
  };
}

/** null when the id doesn't exist */
export async function getRole(id: string): Promise<Role | null> {
  if (USE_MOCK) return MOCK_ROLES.find((role) => role.id === id) ?? null;
  const res = await getRoleApi(id);
  return res.data.data;
}

export async function createRole(input: RoleInput): Promise<Role> {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    const nextId =
      Math.max(0, ...MOCK_ROLES.map((role) => Number(role.id.slice(3)))) + 1;
    const created: Role = {
      ...input,
      id: `RL-${String(nextId).padStart(3, "0")}`,
      isSystem: false,
      createdBy: MOCK_PROFILE.firstName,
      createdAt: now,
      updatedBy: MOCK_PROFILE.firstName,
      updatedAt: now,
    };
    MOCK_ROLES.push(created);
    return created;
  }
  const res = await createRoleApi(input);
  return res.data.data;
}

export async function updateRole(id: string, input: RoleInput): Promise<Role> {
  if (USE_MOCK) {
    const target = MOCK_ROLES.find((role) => role.id === id);
    if (!target) throw new Error("ไม่พบบทบาทนี้");
    Object.assign(target, input, {
      updatedBy: MOCK_PROFILE.firstName,
      updatedAt: new Date().toISOString(),
    });
    return target;
  }
  const res = await updateRoleApi(id, input);
  return res.data.data;
}

/** throws SystemRoleError when the role ships with the system */
export async function deleteRole(id: string): Promise<void> {
  if (USE_MOCK) {
    const index = MOCK_ROLES.findIndex((role) => role.id === id);
    if (index < 0) return;
    if (MOCK_ROLES[index].isSystem) throw new SystemRoleError();
    MOCK_ROLES.splice(index, 1);
    return;
  }
  try {
    await deleteRoleApi(id);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409)
      throw new SystemRoleError();
    throw error;
  }
}
