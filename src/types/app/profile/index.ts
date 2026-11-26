import type { PermissionKey, RoleRef } from "@/types/app/roles";
import type { SigningMethod } from "@/types/app/signers";

export interface UserProfile {
  id: string;
  /** ยศ/ตำแหน่ง — the prefix select (นาย / นาง / ส.อ. …) */
  prefix: string;
  firstName: string;
  lastName: string;
  /** full display name, prefix + first + last */
  name: string;
  /** ตำแหน่ง */
  position: string;
  department: string;
  email: string;
  phone: string;
  /** ชื่อผู้ใช้งาน */
  username: string;
  /** วันที่สร้างบัญชี (ISO) */
  createdAt: string;
  /** เข้าสู่ระบบครั้งล่าสุด (ISO) */
  lastLoginAt: string;
  avatarUrl?: string;
  /** the roles given in ตั้งค่าระบบ › ผู้ใช้งาน — shown on the profile, read-only */
  roles: RoleRef[];
  /**
   * What this user may do, from their role(s) — the UI hides what isn't here.
   * Read-only: the backend decides it and must enforce it on every endpoint.
   */
  permissions: PermissionKey[];
  /**
   * วิธีลงลายเซ็นต์ from ตั้งค่าระบบ › ผู้ใช้งาน — how this officer makes the
   * final signature: USB_TOKEN signs on this PC, CERTIFICATE_FILE lets the
   * server sign with the stored certificate. null for an account that is not
   * a signer. Read-only here.
   */
  signingMethod: SigningMethod | null;
  /** the stored certificate's file name, for CERTIFICATE_FILE; null when none */
  certificateFileName: string | null;
}
