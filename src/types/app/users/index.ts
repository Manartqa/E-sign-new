import type { SortParams } from "@/types/app/common";
import type { RoleRef } from "@/types/app/roles";
import type { SigningMethod } from "@/types/app/signers";
/**
 * ตั้งค่าระบบ › ผู้ใช้งาน — not in Figma or the handoff. One record per person:
 * the account, the roles it holds, and the signing data that used to live on a
 * separate ผู้มีอำนาจลงนาม record (fields from the legacy ผู้ตรวจสอบ screens).
 * Anyone with an approval level can be put into a signing workflow; a user's
 * permissions are the union of their roles' permissions.
 */

export interface User {
  id: string;
  /** ประเภทบุคคล */
  personType: string;
  /** ระดับการอนุมัติ — "" when not set, which keeps the user out of workflows */
  approvalLevel: string;
  /** ใช้งาน — only active users can be picked into a workflow */
  isActive: boolean;
  /** คำนำหน้าชื่อ — e.g. "พล.ต." */
  prefix: string;
  firstName: string;
  lastName: string;
  /** display name — `${prefix}${firstName} ${lastName}`, composed by the server */
  name: string;
  /** เลขที่บัตรประชาชน — 13 digits, or "" */
  nationalId: string;
  /** also the sign-in name */
  email: string;
  /** ตำแหน่ง — may be empty; some legacy rows have none */
  position: string;
  department: string;
  /** หมายเหตุ */
  note: string;
  roles: RoleRef[];
  /** วิธีลงลายเซ็นต์ */
  signingMethod: SigningMethod;
  /** the uploaded certificate's file name; null when none (never the file or PIN) */
  certificateFileName: string | null;
  /** รูปลายเซ็นต์ */
  signatureImageUrl: string | null;
  /** เข้าสู่ระบบครั้งล่าสุด (ISO); null until the first sign-in */
  lastLoginAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/** what the add / edit form submits (sent as multipart/form-data) */
export interface UserInput
  extends Pick<
    User,
    | "personType"
    | "approvalLevel"
    | "isActive"
    | "prefix"
    | "firstName"
    | "lastName"
    | "nationalId"
    | "email"
    | "position"
    | "department"
    | "note"
    | "signingMethod"
  > {
  /** omit to leave the roles alone — only ROLES:UPDATE may change them */
  roleIds?: string[];
  /** a new certificate and its PIN; omit to keep the current one */
  certificate?: { file: File; pin: string };
  /** a new image, or null to remove the current one; omit to keep it */
  signatureImage?: File | null;
}

export interface UserListParams extends SortParams {
  keyword?: string;
  /** only users marked ใช้งาน */
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface UserListResult {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

/** thrown by deleteUser when a signing workflow still uses the user */
export class UserInUseError extends Error {
  constructor() {
    super("ผู้ใช้งานนี้ถูกใช้อยู่ในกระบวนการลงนาม");
  }
}
