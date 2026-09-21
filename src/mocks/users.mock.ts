import {
  APPROVAL_LEVEL_FINAL,
  SIGNING_METHOD,
  type SigningMethod,
} from "@/types/app/signers";
import type { User } from "@/types/app/users";
import { MOCK_PROFILE, MOCK_FINAL_SIGNER_PROFILE } from "./profile.mock";

/** a mock user and the ids of the roles it holds (names resolve on read) */
export type MockUser = Omit<User, "roles"> & { roleIds: string[] };

const user = (
  id: number,
  [prefix, firstName, lastName]: [string, string, string],
  details: {
    email: string;
    position: string;
    department?: string;
    personType?: string;
    approvalLevel?: string;
    signingMethod?: SigningMethod;
    roleIds: string[];
    lastLoginAt?: string | null;
  },
  created: [string, string],
  updated: [string, string] = created,
): MockUser => ({
  id: `OFF-${String(id).padStart(3, "0")}`,
  personType: details.personType ?? "SIGNER",
  approvalLevel: details.approvalLevel ?? "",
  isActive: true,
  prefix,
  firstName,
  lastName,
  name: `${prefix}${firstName} ${lastName}`,
  nationalId: "",
  email: details.email,
  position: details.position,
  department: details.department ?? "กรมการอุตสาหกรรมทหาร",
  note: "",
  roleIds: details.roleIds,
  signingMethod: details.signingMethod ?? SIGNING_METHOD.USB_TOKEN,
  certificateFileName: null,
  signatureImageUrl: null,
  lastLoginAt: details.lastLoginAt ?? null,
  createdBy: created[0],
  createdAt: created[1],
  updatedBy: updated[0],
  updatedAt: updated[1],
});

/** the name parts of a sign-in profile, so the two lists can't drift */
const nameOf = (p: typeof MOCK_PROFILE): [string, string, string] => [
  p.prefix,
  p.firstName,
  p.lastName,
];

/**
 * One list for accounts and signers — they are the same people. Invented, as
 * there is no user master yet:
 * - OFF-001/002 are the two officers you can sign in as (auth.mock), with the
 *   roles and positions their profiles start with; OFF-002 is also the
 *   ผู้ตรวจสอบและลงนาม at the end of every workflow.
 * - OFF-003..006 reuse the officers named in the reports mock.
 * - OFF-007..015 are the former ผู้มีอำนาจลงนาม rows: three invented to back the
 *   workflow positions, the rest transcribed from the legacy ผู้ตรวจสอบ
 *   screen. OFF-012 and OFF-015 have no approval level, so the workflow
 *   picker's disabled rows can be seen. Their e-mails are invented.
 *
 * Edits made on ผู้ใช้งาน change this array in memory: they last until the page
 * reloads.
 */
export const MOCK_USERS: MockUser[] = [
  user(1, nameOf(MOCK_PROFILE), {
    email: MOCK_PROFILE.email,
    position: MOCK_PROFILE.position,
    department: MOCK_PROFILE.department,
    personType: "OFFICER",
    roleIds: ["RL-001"],
    lastLoginAt: MOCK_PROFILE.lastLoginAt,
  }, ["ระบบ", MOCK_PROFILE.createdAt]),
  user(2, nameOf(MOCK_FINAL_SIGNER_PROFILE), {
    email: MOCK_FINAL_SIGNER_PROFILE.email,
    position: MOCK_FINAL_SIGNER_PROFILE.position,
    department: MOCK_FINAL_SIGNER_PROFILE.department,
    approvalLevel: APPROVAL_LEVEL_FINAL,
    roleIds: ["RL-003"],
    lastLoginAt: MOCK_FINAL_SIGNER_PROFILE.lastLoginAt,
  }, ["worapob", "2026-08-03T07:20:00Z"]),
  user(3, ["ส.อ.หญิง", "พิชารภรณ์", "ผดุงขวัญ"], {
    email: "pitcharaporn.pa@smartalliance.co.th",
    position: "เจ้าหน้าที่ตรวจสอบคำขอ",
    personType: "REVIEWER",
    roleIds: ["RL-002"],
    lastLoginAt: "2026-09-20T08:12:00+07:00",
  }, ["มนัสนันท์", "2026-02-12T09:00:00+07:00"]),
  user(4, ["นางสาว", "มาลี", "รักงาน"], {
    email: "malee.ra@smartalliance.co.th",
    position: "เจ้าหน้าที่ธุรการ",
    personType: "OFFICER",
    roleIds: ["RL-004"],
    lastLoginAt: "2026-09-19T13:45:00+07:00",
  }, ["มนัสนันท์", "2026-03-18T13:30:00+07:00"]),
  user(5, ["นาย", "ประสิทธิ์", "ตั้งใจ"], {
    email: "prasit.ta@smartalliance.co.th",
    position: "หัวหน้าแผนกใบอนุญาต",
    personType: "REVIEWER",
    roleIds: ["RL-002", "RL-004"],
    lastLoginAt: "2026-09-18T10:05:00+07:00",
  }, ["ธนกฤต", "2026-03-20T10:00:00+07:00"]),
  user(6, ["นาง", "สุดา", "ทองดี"], {
    email: "suda.th@smartalliance.co.th",
    position: "นักวิเคราะห์นโยบายและแผน",
    department: "สำนักงานปลัดกระทรวงกลาโหม",
    personType: "OFFICER",
    roleIds: ["RL-005"],
    lastLoginAt: "2026-08-30T15:20:00+07:00",
  }, ["มนัสนันท์", "2026-04-02T11:10:00+07:00"]),
  user(7, ["พ.อ.", "สมชาย", "ใจดี"], {
    email: "somchai.ja@smartalliance.co.th",
    position: "ผอ.กคร.",
    approvalLevel: "1",
    roleIds: ["RL-003"],
  }, ["Anan", "2025-04-30T06:50:00Z"]),
  user(8, ["พล.ท.", "สมศักดิ์", "รักชาติ"], {
    email: "somsak.ra@smartalliance.co.th",
    position: "จก.กอท.",
    approvalLevel: "2",
    roleIds: ["RL-003"],
  }, ["Anan", "2025-04-30T06:52:00Z"]),
  user(9, ["พล.ร.อ.", "สมหมาย", "มั่นคง"], {
    email: "sommai.ma@smartalliance.co.th",
    position: "รอง ปล.กห.",
    approvalLevel: "3",
    roleIds: ["RL-003"],
  }, ["Anan", "2025-04-30T06:55:00Z"], ["Anan", "2025-06-16T10:40:00Z"]),
  user(10, ["พล.ต.", "ชาลิต", "สาลีติด"], {
    email: "chalit.sa@smartalliance.co.th",
    position: "รอง จก.อท.ศอพท.ทำการแทน จก.อท.ศอพท.",
    approvalLevel: "2",
    roleIds: ["RL-003"],
  }, ["pongthorn", "2016-03-11T10:12:00Z"], ["kusuma", "2016-10-04T06:20:00Z"]),
  user(11, ["พลโท", "ชุมพล", "อามระดิษ"], {
    email: "chumpol.am@smartalliance.co.th",
    position: "เจ้ากรมการอุตสาหกรรมทหาร ศูนย์การอุตสาหกรรมป้องกันประเทศและพลังงานทหาร ทำการแทน ปลัดกระทรวงกลาโหม",
    approvalLevel: "3",
    roleIds: ["RL-003"],
  }, ["pongthorn", "2017-03-16T07:17:00Z"], ["kusuma", "2019-10-11T10:03:00Z"]),
  user(12, ["พล.ต.", "กิติ", "ปิ่นมานนท์"], {
    email: "kiti.pi@smartalliance.co.th",
    position: "",
    roleIds: ["RL-003"],
  }, ["kusuma", "2017-11-30T07:22:00Z"]),
  user(13, ["พลเอก", "ชาตอุดม", "ติตถะศิริ"], {
    email: "chatudom.ti@smartalliance.co.th",
    position: "รองปลัดกระทรวงกลาโหม ทำการแทน ปลัดกระทรวงกลาโหม",
    approvalLevel: "3",
    roleIds: ["RL-003"],
  }, ["pongthorn", "2017-04-18T08:20:00Z"], ["pongthorn", "2017-10-18T06:37:00Z"]),
  user(14, ["พ.อ.", "ทิวา", "สุทธิกุลสมบัติ"], {
    email: "tiwa.su@smartalliance.co.th",
    position: "รอง เสธ.อท.ศอพท.",
    approvalLevel: "1",
    roleIds: ["RL-003"],
  }, ["kusuma", "2017-11-30T07:20:00Z"], ["Anan", "2025-02-05T11:10:00Z"]),
  user(15, ["พลตรี", "ชาลิต", "สาลีติด"], {
    email: "chalit.s@smartalliance.co.th",
    position: "",
    roleIds: ["RL-003"],
  }, ["kusuma", "2016-03-14T04:34:00Z"], ["kusuma", "2016-10-04T06:20:00Z"]),
];

/**
 * ตำแหน่ง master list — the legacy ตำแหน่ง picker's rows (deduplicated), plus
 * the positions the mock users above use.
 */
export const MOCK_POSITIONS: string[] = [
  "รองปลัดกระทรวงกลาโหม ทำการแทน ปลัดกระทรวงกลาโหม ทำการแทน รัฐมนตรีว่าการกระทรวงกลาโหม",
  "รองปลัดกระทรวงกลาโหม ทำการแทน ปลัดกระทรวงกลาโหม",
  "เจ้ากรมการอุตสาหกรรมทหาร ศูนย์การอุตสาหกรรมป้องกันประเทศและพลังงานทหาร",
  "เจ้ากรมการอุตสาหกรรมทหาร ศูนย์การอุตสาหกรรมป้องกันประเทศและพลังงานทหาร ทำการแทน ปลัดกระทรวงกลาโหม",
  "รอง ผอ.ศอพท.รักษาราชการแทน ผอ.ศอพท.",
  "รอง ผอ.ศอพท.ทำการแทน ผอ.ศอพท.",
  "จก.อท.ศอพท.",
  "รอง จก.อท.ศอพท.ทำการแทน จก.อท.ศอพท.",
  "รอง เสธ.อท.ศอพท.",
  "ผอ.กคร.",
  "จก.กอท.",
  "รอง ปล.กห.",
  "ปล.กห.",
];
