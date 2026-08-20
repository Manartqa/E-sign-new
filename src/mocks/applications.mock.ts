import { APPLICATION_STATUS, type ApplicationStatus } from "@/constant/status";
import type { ApplicationItem } from "@/types/app/applications";

/** Request types as worded in the Figma table (171:1843). */
const TYPES = [
  {
    type: "sell_in_kingdom",
    typeName: "คำขออนุญาตขายหรือจำหน่ายในราชอาณาจักร (อ.15)",
  },
  { type: "factory_license", typeName: "ใบอนุญาตประกอบกิจการโรงงาน" },
  { type: "factory_expand", typeName: "ใบอนุญาตขยายโรงงาน" },
  { type: "machine_register", typeName: "การจดทะเบียนเครื่องจักร" },
  { type: "hazard_material", typeName: "ใบอนุญาตวัตถุอันตราย" },
];

const OPERATORS = [
  "บริษัท แมกซ์ อาร์ม อินดัสตรี จำกัด",
  "บริษัท ไทยอุตสาหกรรม จำกัด",
  "บริษัท เอเชีย พลาสติก จำกัด",
  "ห้างหุ้นส่วนจำกัด สยามเอ็นจิเนียริ่ง",
  "บริษัท ดีเฟนซ์ เทค (ประเทศไทย) จำกัด",
];

const APPLICANTS = [
  { name: "นายสมชาย ใจดี", nationalId: "1234567890123" },
  { name: "นางสาวปรียา วงศ์สุวรรณ", nationalId: "3101800123456" },
  { name: "บริษัท ไทยอุตสาหกรรม จำกัด", nationalId: "0105536000123" },
  { name: "นายวิชัย รักชาติ", nationalId: "1509900234567" },
  { name: "นางมาลี ศรีสุข", nationalId: "3200600345678" },
  { name: "บริษัท เอเชีย พลาสติก จำกัด", nationalId: "0105545000789" },
  { name: "นายอนุชา พงษ์ไพบูลย์", nationalId: "1103700456789" },
];

const OFFICERS = [
  "ส.อ.หญิง พิชารภรณ์ ผดุงขวัญ",
  "นางสาวมาลี รักงาน",
  "นายประสิทธิ์ ตั้งใจ",
  "นางสุดา ทองดี",
];

const STATUSES: ApplicationStatus[] = [
  APPLICATION_STATUS.PENDING_APPROVAL,
  APPLICATION_STATUS.IN_PROGRESS,
  APPLICATION_STATUS.PENDING_SIGNATURE,
  APPLICATION_STATUS.APPROVED,
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.RETURNED,
];

/**
 * Deterministic ordering (no Math.random), but `updatedAt` is anchored to the
 * real clock so the `วันที่อัปเดต` column reads as "N ชั่วโมงที่แล้ว" instead of
 * drifting into the future. Safe against hydration mismatch because the list is
 * only ever produced inside a React Query `queryFn`, which does not run during
 * SSR — the table renders its loading state on the server.
 */
const NOW = Date.now();
export const MOCK_APPLICATIONS: ApplicationItem[] = Array.from(
  { length: 47 },
  (_, i) => {
    const t = TYPES[i % TYPES.length];
    const a = APPLICANTS[i % APPLICANTS.length];
    const day = String((i % 28) + 1).padStart(2, "0");
    const month = String((i % 12) + 1).padStart(2, "0");
    return {
      id: `APP-2567-${String(1234 + i).padStart(6, "0")}`,
      type: t.type,
      typeName: t.typeName,
      requestNo: `${40 + i}/2569`,
      receiptNo: `อ${String(1424 + i).padStart(5, "0")}/2569`,
      receivedAt: `2026-${month}-${day}T08:00:00Z`,
      operatorName: OPERATORS[i % OPERATORS.length],
      applicantName: a.name,
      applicantNationalId: a.nationalId,
      status: STATUSES[i % STATUSES.length],
      submittedAt: `2026-${month}-${day}T09:30:00Z`,
      // spread backwards over the last few days
      updatedAt: new Date(NOW - (i + 1) * 2 * 3_600_000).toISOString(),
      assignedOfficer: OFFICERS[i % OFFICERS.length],
    };
  },
);

export const APPLICATION_TYPE_OPTIONS = TYPES.map((t) => ({
  value: t.type,
  label: t.typeName,
}));

