import {
  ALL_PERMISSIONS,
  PERMISSION_ACTION,
  PERMISSION_MODULE,
  permissionKey,
  type PermissionKey,
  type Role,
} from "@/types/app/roles";

const { APPLICATIONS, REPORTS, SIGNERS, SIGNING_WORKFLOWS } = PERMISSION_MODULE;
const { VIEW, CREATE, UPDATE, DELETE, APPROVE, SIGN } = PERMISSION_ACTION;

const row = (
  id: number,
  name: string,
  description: string,
  permissions: PermissionKey[],
  isSystem: boolean,
  created: [string, string],
  updated: [string, string],
): Role => ({
  id: `RL-${String(id).padStart(3, "0")}`,
  name,
  description,
  isActive: true,
  isSystem,
  permissions,
  createdBy: created[0],
  createdAt: created[1],
  updatedBy: updated[0],
  updatedAt: updated[1],
});

/**
 * Invented — there is no legacy บทบาท screen to transcribe. RL-001 is the
 * system role (no delete button) and holds every key in the matrix; the rest
 * cover the three jobs the app already has screens for.
 */
export const MOCK_ROLES: Role[] = [
  row(
    1,
    "ผู้ดูแลระบบ",
    "เข้าถึงและจัดการได้ทุกส่วนของระบบ",
    ALL_PERMISSIONS,
    true,
    ["ระบบ", "2026-01-05T09:00:00+07:00"],
    ["ระบบ", "2026-01-05T09:00:00+07:00"],
  ),
  row(
    2,
    "ผู้ตรวจสอบคำขอ",
    "ตรวจสอบและอนุมัติคำขอ แต่ไม่ลงนามและไม่แก้ไขการตั้งค่า",
    [
      permissionKey(APPLICATIONS, VIEW),
      permissionKey(APPLICATIONS, APPROVE),
      permissionKey(REPORTS, VIEW),
      permissionKey(SIGNERS, VIEW),
      permissionKey(SIGNING_WORKFLOWS, VIEW),
    ],
    false,
    ["มนัสนันท์", "2026-02-11T10:20:00+07:00"],
    ["มนัสนันท์", "2026-08-03T14:05:00+07:00"],
  ),
  row(
    3,
    "ผู้มีอำนาจลงนาม",
    "ตรวจสอบ อนุมัติ และลงนามดิจิทัลในคำขอ",
    [
      permissionKey(APPLICATIONS, VIEW),
      permissionKey(APPLICATIONS, APPROVE),
      permissionKey(APPLICATIONS, SIGN),
      permissionKey(REPORTS, VIEW),
    ],
    false,
    ["มนัสนันท์", "2026-02-11T10:32:00+07:00"],
    ["ธนกฤต", "2026-09-01T09:41:00+07:00"],
  ),
  row(
    4,
    "เจ้าหน้าที่ธุรการ",
    "ดูคำขอและรายงาน พร้อมดูแลทะเบียนผู้มีอำนาจลงนาม",
    [
      permissionKey(APPLICATIONS, VIEW),
      permissionKey(REPORTS, VIEW),
      permissionKey(SIGNERS, VIEW),
      permissionKey(SIGNERS, CREATE),
      permissionKey(SIGNERS, UPDATE),
      permissionKey(SIGNERS, DELETE),
      permissionKey(SIGNING_WORKFLOWS, VIEW),
    ],
    false,
    ["ธนกฤต", "2026-03-18T13:12:00+07:00"],
    ["ธนกฤต", "2026-07-22T16:30:00+07:00"],
  ),
  row(
    5,
    "ผู้ดูรายงาน",
    "ดูรายงานภาพรวมอย่างเดียว",
    [permissionKey(REPORTS, VIEW)],
    false,
    ["มนัสนันท์", "2026-04-02T11:00:00+07:00"],
    ["มนัสนันท์", "2026-04-02T11:00:00+07:00"],
  ),
];
