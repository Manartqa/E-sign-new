import { MOCK_PROFILES } from "./profile.mock";

/** a mock account and the ids of the roles it holds */
export interface MockUser {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  lastLoginAt: string;
  roleIds: string[];
}

/**
 * Invented — there is no user master yet. The two officers you can sign in as
 * come first, with the roles their profiles start with; the rest reuse the
 * officers named in the reports mock. updateUserRoles edits `roleIds` in
 * memory, so a change lasts until the page reloads.
 */
export const MOCK_USERS: MockUser[] = [
  ...MOCK_PROFILES.map((profile) => ({
    id: profile.id,
    name: profile.name,
    position: profile.position,
    department: profile.department,
    email: profile.email,
    lastLoginAt: profile.lastLoginAt,
    roleIds: profile.roles.map((role) => role.id),
  })),
  {
    id: "OFF-003",
    name: "ส.อ.หญิงพิชารภรณ์ ผดุงขวัญ",
    position: "เจ้าหน้าที่ตรวจสอบคำขอ",
    department: "กรมการอุตสาหกรรมทหาร",
    email: "pitcharaporn.pa@smartalliance.co.th",
    lastLoginAt: "2026-09-20T08:12:00+07:00",
    roleIds: ["RL-002"],
  },
  {
    id: "OFF-004",
    name: "นางสาวมาลี รักงาน",
    position: "เจ้าหน้าที่ธุรการ",
    department: "กรมการอุตสาหกรรมทหาร",
    email: "malee.ra@smartalliance.co.th",
    lastLoginAt: "2026-09-19T13:45:00+07:00",
    roleIds: ["RL-004"],
  },
  {
    id: "OFF-005",
    name: "นายประสิทธิ์ ตั้งใจ",
    position: "หัวหน้าแผนกใบอนุญาต",
    department: "กรมการอุตสาหกรรมทหาร",
    email: "prasit.ta@smartalliance.co.th",
    lastLoginAt: "2026-09-18T10:05:00+07:00",
    roleIds: ["RL-002", "RL-004"],
  },
  {
    id: "OFF-006",
    name: "นางสุดา ทองดี",
    position: "นักวิเคราะห์นโยบายและแผน",
    department: "สำนักงานปลัดกระทรวงกลาโหม",
    email: "suda.th@smartalliance.co.th",
    lastLoginAt: "2026-08-30T15:20:00+07:00",
    roleIds: ["RL-005"],
  },
];
