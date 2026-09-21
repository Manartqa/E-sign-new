import type { SortParams } from "@/types/app/common";
import type { RoleRef } from "@/types/app/roles";
/**
 * ตั้งค่าระบบ › ผู้ใช้งาน — not in Figma or the handoff. Accounts come from the
 * backend (or SSO); this screen only decides which roles each one holds. A
 * user's permissions are the union of their roles' permissions.
 */

export interface User {
  id: string;
  /** display name, prefix + first + last */
  name: string;
  /** ตำแหน่ง */
  position: string;
  department: string;
  email: string;
  roles: RoleRef[];
  /** เข้าสู่ระบบครั้งล่าสุด (ISO) */
  lastLoginAt: string;
}

export interface UserListParams extends SortParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface UserListResult {
  items: User[];
  total: number;
  page: number;
  limit: number;
}
