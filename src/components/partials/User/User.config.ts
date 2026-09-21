import type { SelectOption } from "@/components/common";
import {
  APPROVAL_LEVEL_FINAL,
  SIGNING_METHOD,
  type SigningMethod,
} from "@/types/app/signers";

/** from the legacy ระดับการอนุมัติ dropdown: ผู้ตรวจสอบ 1–19, then ผู้ตรวจสอบและลงนาม */
export const APPROVAL_LEVEL_OPTIONS: SelectOption[] = [
  ...Array.from({ length: 19 }, (_, i) => ({
    value: String(i + 1),
    label: `ผู้ตรวจสอบ ${i + 1}`,
  })),
  { value: APPROVAL_LEVEL_FINAL, label: "ผู้ตรวจสอบและลงนาม" },
];

export const approvalLevelLabel = (level: string) =>
  APPROVAL_LEVEL_OPTIONS.find((option) => option.value === level)?.label ??
  "ยังไม่กำหนดระดับการอนุมัติ";

export const SIGNING_METHOD_OPTIONS: {
  value: SigningMethod;
  label: string;
  description: string;
}[] = [
  {
    value: SIGNING_METHOD.USB_TOKEN,
    label: "USB Token",
    description: "เสียบ USB Token และกรอก PIN ทุกครั้งที่ลงนาม",
  },
  {
    value: SIGNING_METHOD.CERTIFICATE_FILE,
    label: "Certificate File",
    description: "อัปโหลดไฟล์ใบรับรอง (.p12 / .pfx) เก็บไว้ในระบบ",
  },
  {
    value: SIGNING_METHOD.E_DOCUMENT,
    label: "E-Document",
    description: "ลงนามผ่านระบบเอกสารอิเล็กทรอนิกส์",
  },
];

/** 13 digits with a valid Thai national ID check digit */
export function isValidNationalId(id: string) {
  if (!/^\d{13}$/.test(id)) return false;
  const sum = [...id.slice(0, 12)].reduce(
    (total, digit, i) => total + Number(digit) * (13 - i),
    0,
  );
  return (11 - (sum % 11)) % 10 === Number(id[12]);
}

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** a role's name as a pill — ผู้ใช้งาน list, its form, and the profile page */
export const ROLE_PILL =
  "rounded-full bg-brand-navy-mid/10 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-brand-navy-mid";
