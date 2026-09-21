import type { DecisionAction } from "@/types/app/applications";
import type { MasterOption } from "@/types/app/master";

/**
 * Figma shows one ส่งคืน reason ("เอกสารแนบไม่ชัดเจน / ไม่ครบถ้วน"); the rest,
 * and every code, are placeholders until the real list comes from the backend.
 */
export const MOCK_DECISION_REASONS: Record<DecisionAction, MasterOption[]> = {
  RETURN: [
    { value: "RET_DOC_UNCLEAR", label: "เอกสารแนบไม่ชัดเจน / ไม่ครบถ้วน" },
    { value: "RET_OPERATOR_MISMATCH", label: "ข้อมูลผู้ประกอบการไม่ตรงกับหลักฐาน" },
    { value: "RET_ITEMS_INCOMPLETE", label: "รายการที่ขออนุญาตไม่ครบถ้วน" },
    { value: "RET_DOC_EXPIRED", label: "เอกสารหมดอายุ" },
    { value: "RET_OTHER", label: "อื่นๆ" },
  ],
  REJECT: [
    { value: "REJ_NOT_QUALIFIED", label: "คุณสมบัติผู้ยื่นไม่เป็นไปตามหลักเกณฑ์" },
    { value: "REJ_NOT_PERMITTED", label: "รายการที่ขออนุญาตไม่อยู่ในข่ายที่อนุญาตได้" },
    { value: "REJ_FALSE_EVIDENCE", label: "เอกสารหลักฐานเป็นเท็จ" },
    { value: "REJ_OTHER", label: "อื่นๆ" },
  ],
};

/** placeholders — the legacy screen only shows "ทุกประเภทยุทธภัณฑ์" */
export const MOCK_WEAPON_CATEGORIES: MasterOption[] = [
  { value: "firearm", label: "อาวุธปืนและส่วนประกอบ" },
  { value: "ammunition", label: "กระสุนและวัตถุระเบิด" },
  { value: "vehicle", label: "ยานพาหนะและอุปกรณ์ทางทหาร" },
  { value: "other", label: "ยุทธภัณฑ์อื่น ๆ" },
];

/** placeholders — the legacy screen shows only an empty select */
export const MOCK_PERSON_TYPES: MasterOption[] = [
  { value: "SIGNER", label: "ผู้มีอำนาจลงนาม" },
  { value: "REVIEWER", label: "ผู้ตรวจสอบ" },
  // users who neither review nor sign (e.g. clerks, system admins)
  { value: "OFFICER", label: "เจ้าหน้าที่" },
];

/** covers the forms seen in legacy rows (พล.ต. and พลตรี both occur) */
export const MOCK_PREFIXES: MasterOption[] = [
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
