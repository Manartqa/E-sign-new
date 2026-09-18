import type { UserProfile } from "@/types/app/profile";

/**
 * Two officers, so both signing screens can be walked without editing code:
 * sign in as one to get the button-only signature, as the other to get the
 * USB-token one. They hold one role each — whether a request's chain ends at
 * that role is what decides the screen, and each officer's queue is built that
 * way in applications.mock.
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
  email: "sombat.th@smartalliance.co.th",
  phone: "0898765432",
  username: "sombat.th@smartalliance.co.th",
  createdAt: "2024-01-01T00:00:00Z",
  lastLoginAt: "2025-05-15T02:30:00Z",
};

export const MOCK_PROFILES: UserProfile[] = [
  MOCK_PROFILE,
  MOCK_FINAL_SIGNER_PROFILE,
];
