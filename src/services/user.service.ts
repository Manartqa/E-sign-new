import { USE_MOCK } from "@/lib/env";
import { sortRows } from "@/lib/sort";
import {
  getUserApi,
  getUsersApi,
  updateUserRolesApi,
} from "@/lib/api/api-main";
import { rolesOf } from "@/mocks/roles.mock";
import { MOCK_USERS, type MockUser } from "@/mocks/users.mock";
import type { User, UserListParams, UserListResult } from "@/types/app/users";

const DEFAULT_LIMIT = 10;

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Mock branches edit MOCK_USERS in memory: changes survive navigation but
 * reset on a page reload, like the roles they point at.
 */

const toUser = ({ roleIds, ...user }: MockUser): User => ({
  ...user,
  roles: rolesOf(roleIds).roles,
});

export async function getUsers(
  params: UserListParams = {},
): Promise<UserListResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;

  if (USE_MOCK) {
    const keyword = params.keyword?.trim().toLowerCase() ?? "";
    const filtered = sortRows(
      MOCK_USERS.map(toUser).filter(
        (user) =>
          !keyword ||
          user.name.toLowerCase().includes(keyword) ||
          user.email.toLowerCase().includes(keyword),
      ),
      params,
      (user, key) =>
        key === "roles"
          ? user.roles.map((role) => role.name).join(", ")
          : user[key as keyof User],
    );
    return {
      items: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    };
  }

  const res = await getUsersApi({ ...params, page, limit });
  return {
    items: res.data.data,
    total: res.data.total,
    page: res.data.page,
    limit: res.data.limit,
  };
}

/** null when the id doesn't exist */
export async function getUser(id: string): Promise<User | null> {
  if (USE_MOCK) {
    const user = MOCK_USERS.find((item) => item.id === id);
    return user ? toUser(user) : null;
  }
  const res = await getUserApi(id);
  return res.data.data;
}

/** replaces every role the user holds with `roleIds` */
export async function updateUserRoles(
  id: string,
  roleIds: string[],
): Promise<User> {
  if (USE_MOCK) {
    const target = MOCK_USERS.find((user) => user.id === id);
    if (!target) throw new Error("ไม่พบผู้ใช้งานนี้");
    target.roleIds = roleIds;
    return toUser(target);
  }
  const res = await updateUserRolesApi(id, { roleIds });
  return res.data.data;
}
