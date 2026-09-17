import {
  APPROVAL_LEVEL_FINAL,
  SIGNING_METHOD,
  type Signer,
} from "@/types/app/signers";

const row = (
  id: number,
  [prefix, firstName, lastName]: [string, string, string],
  position: string,
  approvalLevel: string,
  created: [string, string],
  updated: [string, string],
): Signer => ({
  id: `SG-${String(id).padStart(3, "0")}`,
  personType: "SIGNER",
  approvalLevel,
  isActive: true,
  prefix,
  firstName,
  lastName,
  name: `${prefix}${firstName} ${lastName}`,
  nationalId: "",
  email: "",
  position,
  note: "",
  signingMethod: SIGNING_METHOD.USB_TOKEN,
  certificateFileName: null,
  signatureImageUrl: null,
  createdBy: created[0],
  createdAt: created[1],
  updatedBy: updated[0],
  updatedAt: updated[1],
});

/**
 * SG-001..004 are invented to back the positions used in
 * signingWorkflows.mock.ts; the rest are transcribed from the legacy
 * ผู้ตรวจสอบ screen. Approval levels are invented; SG-006 and SG-010 have none
 * so the workflow picker's disabled rows can be seen.
 */
export const MOCK_SIGNERS: Signer[] = [
  row(1, ["พ.อ.", "สมชาย", "ใจดี"], "ผอ.กคร.", "1", ["Anan", "2025-04-30T06:50:00Z"], ["Anan", "2025-04-30T06:50:00Z"]),
  row(2, ["พล.ท.", "สมศักดิ์", "รักชาติ"], "จก.กอท.", "2", ["Anan", "2025-04-30T06:52:00Z"], ["Anan", "2025-04-30T06:52:00Z"]),
  row(3, ["พล.ร.อ.", "สมหมาย", "มั่นคง"], "รอง ปล.กห.", "3", ["Anan", "2025-04-30T06:55:00Z"], ["Anan", "2025-06-16T10:40:00Z"]),
  row(4, ["พล.อ.", "สมบัติ", "ทองดี"], "ปล.กห.", APPROVAL_LEVEL_FINAL, ["worapob", "2026-08-03T07:20:00Z"], ["worapob", "2026-08-03T07:20:00Z"]),
  row(5, ["พล.ต.", "ชาลิต", "สาลีติด"], "รอง จก.อท.ศอพท.ทำการแทน จก.อท.ศอพท.", "2", ["pongthorn", "2016-03-11T10:12:00Z"], ["kusuma", "2016-10-04T06:20:00Z"]),
  row(6, ["พลตรี", "ชาลิต", "สาลีติด"], "", "", ["kusuma", "2016-03-14T04:34:00Z"], ["kusuma", "2016-10-04T06:20:00Z"]),
  row(7, ["พลโท", "ชุมพล", "อามระดิษ"], "เจ้ากรมการอุตสาหกรรมทหาร ศูนย์การอุตสาหกรรมป้องกันประเทศและพลังงานทหาร ทำการแทน ปลัดกระทรวงกลาโหม", "3", ["pongthorn", "2017-03-16T07:17:00Z"], ["kusuma", "2019-10-11T10:03:00Z"]),
  row(8, ["พลเอก", "ชาตอุดม", "ติตถะศิริ"], "รองปลัดกระทรวงกลาโหม ทำการแทน ปลัดกระทรวงกลาโหม", "3", ["pongthorn", "2017-04-18T08:20:00Z"], ["pongthorn", "2017-10-18T06:37:00Z"]),
  row(9, ["พ.อ.", "ทิวา", "สุทธิกุลสมบัติ"], "รอง เสธ.อท.ศอพท.", "1", ["kusuma", "2017-11-30T07:20:00Z"], ["Anan", "2025-02-05T11:10:00Z"]),
  row(10, ["พล.ต.", "กิติ", "ปิ่นมานนท์"], "", "", ["kusuma", "2017-11-30T07:22:00Z"], ["kusuma", "2017-11-30T07:22:00Z"]),
];

/**
 * ตำแหน่ง master list — the legacy ตำแหน่ง picker's rows (deduplicated), plus
 * the positions the mock signers above use.
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
