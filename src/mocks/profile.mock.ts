import type { UserProfile } from "@/types/app/profile";
import { rolesOf } from "./roles.mock";

/**
 * Two officers, so both signing screens can be walked without editing code:
 * sign in as one to get the button-only signature, as the other to get the
 * USB-token one. They hold one role each — whether a request's chain ends at
 * that role is what decides the screen, and each officer's queue is built that
 * way in applications.mock.
 *
 * They also hold different roles, so permission gating can be seen too: the
 * first is ผู้ดูแลระบบ (everything), the second ผู้มีอำนาจลงนาม (requests and
 * reports only — no ตั้งค่าระบบ).
 */
export const MOCK_PROFILE: UserProfile = {
  id: "OFF-001",
  prefix: "นาย",
  firstName: "มานัส",
  lastName: "ประทุมชู",
  name: "นายมานัส ประทุมชู",
  position: "QA",
  department: "กรมการอุตสาหกรรมทหาร",
  email: "manart.pa@smartalliance.co.th",
  phone: "0812345678",
  username: "manart.pa@smartalliance.co.th",
  createdAt: "2024-01-01T00:00:00Z",
  lastLoginAt: "2025-05-15T02:30:00Z",
  ...rolesOf(["RL-001"]),
};

/** ผู้ลงนามลำดับสุดท้าย — every request in this officer's queue needs the token */
export const MOCK_FINAL_SIGNER_PROFILE: UserProfile = {
  id: "OFF-002",
  prefix: "พล.อ.",
  firstName: "สมบัติ",
  lastName: "ทองดี",
  name: "พล.อ.สมบัติ ทองดี",
  position: "ปล.กห.",
  department: "สำนักงานปลัดกระทรวงกลาโหม",
  // the test USB token's certificate email (SMART-Esig), so the token matches
  email: "adminsmart@smartalliance.co.th",
  phone: "0898765432",
  username: "adminsmart@smartalliance.co.th",
  createdAt: "2024-01-01T00:00:00Z",
  lastLoginAt: "2025-05-15T02:30:00Z",
  ...rolesOf(["RL-003"]),
};

export const MOCK_PROFILES: UserProfile[] = [
  MOCK_PROFILE,
  MOCK_FINAL_SIGNER_PROFILE,
];
