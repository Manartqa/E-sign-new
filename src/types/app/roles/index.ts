import type { SortParams } from "@/types/app/common";
/**
 * ตั้งค่าระบบ › บทบาทและสิทธิ์ — not in Figma or the handoff. A role carries a
 * flat list of `MODULE:ACTION` permissions; nothing enforces them yet (the app
 * still lets every account do everything), these screens only manage the data.
 */

export const PERMISSION_MODULE = {
  APPLICATIONS: "APPLICATIONS",
  REPORTS: "REPORTS",
  SIGNING_WORKFLOWS: "SIGNING_WORKFLOWS",
  ROLES: "ROLES",
  USERS: "USERS",
} as const;
export type PermissionModule =
  (typeof PERMISSION_MODULE)[keyof typeof PERMISSION_MODULE];

export const PERMISSION_ACTION = {
  VIEW: "VIEW",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  APPROVE: "APPROVE",
  SIGN: "SIGN",
} as const;
export type PermissionAction =
  (typeof PERMISSION_ACTION)[keyof typeof PERMISSION_ACTION];

/** one cell of the permission matrix, e.g. "APPLICATIONS:APPROVE" */
export type PermissionKey = `${PermissionModule}:${PermissionAction}`;

export const permissionKey = (
  module: PermissionModule,
  action: PermissionAction,
): PermissionKey => `${module}:${action}`;

/**
 * Which actions each module offers — the shape of the permission matrix, and
 * the whole set of keys a role can hold.
 */
export const PERMISSION_MATRIX: {
  module: PermissionModule;
  actions: PermissionAction[];
}[] = [
  {
    module: PERMISSION_MODULE.APPLICATIONS,
    actions: [
      PERMISSION_ACTION.VIEW,
      PERMISSION_ACTION.APPROVE,
      PERMISSION_ACTION.SIGN,
    ],
  },
  { module: PERMISSION_MODULE.REPORTS, actions: [PERMISSION_ACTION.VIEW] },
  {
    module: PERMISSION_MODULE.SIGNING_WORKFLOWS,
    actions: [
      PERMISSION_ACTION.VIEW,
      PERMISSION_ACTION.CREATE,
      PERMISSION_ACTION.UPDATE,
      PERMISSION_ACTION.DELETE,
    ],
  },
  {
    module: PERMISSION_MODULE.ROLES,
    actions: [
      PERMISSION_ACTION.VIEW,
      PERMISSION_ACTION.CREATE,
      PERMISSION_ACTION.UPDATE,
      PERMISSION_ACTION.DELETE,
    ],
  },
  {
    module: PERMISSION_MODULE.USERS,
    actions: [
      PERMISSION_ACTION.VIEW,
      PERMISSION_ACTION.CREATE,
      PERMISSION_ACTION.UPDATE,
      PERMISSION_ACTION.DELETE,
    ],
  },
];

/** every key in the matrix — what บทบาทผู้ดูแลระบบ holds */
export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_MATRIX.flatMap(
  ({ module, actions }) => actions.map((action) => permissionKey(module, action)),
);

export interface Role {
  id: string;
  /** ชื่อบทบาท */
  name: string;
  /** คำอธิบาย */
  description: string;
  /** ใช้งาน — a disabled role stays on the list but can't be assigned */
  isActive: boolean;
  /** บทบาทระบบ — shipped with the system, so it can't be deleted */
  isSystem: boolean;
  permissions: PermissionKey[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/** a role as it is attached to a user — enough to name it */
export type RoleRef = Pick<Role, "id" | "name">;

/** what the add / edit form submits */
export type RoleInput = Pick<
  Role,
  "name" | "description" | "isActive" | "permissions"
>;

export interface RoleListParams extends SortParams {
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface RoleListResult {
  items: Role[];
  total: number;
  page: number;
  limit: number;
}

/** thrown by deleteRole when the role is a system one */
export class SystemRoleError extends Error {
  constructor() {
    super("บทบาทของระบบไม่สามารถลบได้");
  }
}
