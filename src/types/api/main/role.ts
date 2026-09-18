import type { Role, RoleInput } from "@/types/app/roles";

/**
 * /api/roles — not in the handoff; mirrors the settings screens until the
 * backend defines its own contract. Deleting a system role is expected to
 * answer 409.
 */
export type RoleResponse = Role;
export type RoleRequest = RoleInput;
