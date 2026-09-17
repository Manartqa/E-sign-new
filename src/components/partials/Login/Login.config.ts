import { Clock, FileCheck, ShieldCheck, type LucideIcon } from "lucide-react";

export const HERO_DEPARTMENT = "กรมการอุตสาหกรรมทหาร";
export const HERO_MINISTRY = "กระทรวงกลาโหม";
export const HERO_TITLE_LINES = [
  "ระบบการลงนามอนุมัติด้วยลายมือชื่อดิจิทัล",
  "(E-Signature)",
];
export const HERO_SUBTITLE = "Digital Approval and E-Signature System";
export const HERO_FOOTER =
  "ศูนย์การอุตสาหกรรมป้องกันประเทศและพลังงานทหาร";

export const HERO_FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "ปลอดภัยด้วยมาตรฐาน PKI" },
  { icon: Clock, label: "ลดขั้นตอน เพิ่มความรวดเร็ว" },
  { icon: FileCheck, label: "รองรับการลงนามดิจิทัลตามกฎหมาย" },
];

export const USERNAME_PLACEHOLDER = "เช่น officer.name@agency.go.th";
export const PASSWORD_PLACEHOLDER = "กรอกรหัสผ่าน";

/**
 * จำข้อมูลเข้าสู่ระบบ keeps only the username, in localStorage — never the
 * password. Written after a successful sign-in, cleared when unticked.
 */
const REMEMBERED_USERNAME_KEY = "login-remembered-username";

export function readRememberedUsername(): string {
  try {
    return window.localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? "";
  } catch {
    return ""; // storage blocked (private mode, disabled site data)
  }
}

export function writeRememberedUsername(username: string | null) {
  try {
    if (username) window.localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
    else window.localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  } catch {
    // storage blocked — the sign-in itself still succeeds
  }
}

/** Figma `login-page error` → Form error state banner */
export const LOGIN_ERROR_MESSAGE = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
