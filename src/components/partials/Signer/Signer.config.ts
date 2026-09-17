import type { SelectOption } from "@/components/common";
import {
  APPROVAL_LEVEL_FINAL,
  SIGNING_METHOD,
  type SigningMethod,
} from "@/types/app/signers";

/**
 * Except ระดับการอนุมัติ, these option lists are placeholders — the legacy screen shows only
 * empty selects — until the backend supplies the real master data. The
 * prefixes cover the forms seen in legacy rows (พล.ต. and พลตรี both occur).
 */
export const PERSON_TYPE_OPTIONS: SelectOption[] = [
  { value: "SIGNER", label: "ผู้มีอำนาจลงนาม" },
  { value: "REVIEWER", label: "ผู้ตรวจสอบ" },
];

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

export const PREFIX_OPTIONS: SelectOption[] = [
  "นาย",
  "นาง",
  "นางสาว",
  "พล.อ.",
  "พล.ท.",
  "พล.ต.",
  "พลเอก",
  "พลโท",
  "พลตรี",
  "พล.ร.อ.",
  "พล.ร.ท.",
  "พล.ร.ต.",
  "พล.อ.อ.",
  "พล.อ.ท.",
  "พล.อ.ต.",
  "พ.อ.",
  "พ.ท.",
  "พ.ต.",
  "น.อ.",
  "น.ท.",
  "น.ต.",
  "พ.อ.หญิง",
  "น.อ.หญิง",
].map((prefix) => ({ value: prefix, label: prefix }));

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
