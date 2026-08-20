import { APPLICATION_STATUS, type ApplicationStatus } from "@/constant/status";
import type {
  ApplicationDetail,
  ApplicationItem,
} from "@/types/app/applications";

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

export function buildMockDetail(item: ApplicationItem): ApplicationDetail {
  return {
    ...item,
    sections: {
      applicant: [
        { label: "ชื่อผู้ยื่นคำขอ", value: item.applicantName },
        { label: "ผู้ประกอบการ", value: item.operatorName },
        { label: "เลขที่คำขอ", value: item.requestNo },
        { label: "เลขรับเรื่อง", value: item.receiptNo },
        { label: "เลขประจำตัวประชาชน / นิติบุคคล", value: item.applicantNationalId },
        { label: "ประเภทคำขอ", value: item.typeName },
        { label: "โทรศัพท์", value: "02-123-4567" },
        { label: "อีเมล", value: "contact@example.co.th" },
        { label: "ที่อยู่", value: "99/1 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110" },
      ],
      factory: [
        { label: "ชื่อโรงงาน", value: "โรงงานผลิตชิ้นส่วนยานยนต์ สาขา 1" },
        { label: "เลขทะเบียนโรงงาน", value: "3-64(1)-1/56" },
        { label: "จำพวกโรงงาน", value: "จำพวกที่ 3" },
        { label: "แรงม้าเครื่องจักรรวม", value: "1,250 แรงม้า" },
        { label: "จำนวนคนงาน", value: "184 คน" },
      ],
      persons: [
        { label: "กรรมการผู้มีอำนาจ", value: "นายวิชัย รักชาติ" },
        { label: "ผู้รับมอบอำนาจ", value: "นางสาวปรียา วงศ์สุวรรณ" },
        { label: "วิศวกรควบคุม", value: "นายธนา สุขเกษม (ภย. 12345)" },
      ],
      buildings: [
        { label: "จำนวนอาคาร", value: "3 อาคาร" },
        { label: "พื้นที่ใช้สอยรวม", value: "8,400 ตารางเมตร" },
        { label: "ที่ตั้ง", value: "นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี" },
      ],
      requestedItems: [
        { label: "รายการที่ 1", value: "ขออนุญาตติดตั้งเครื่องจักรเพิ่มเติม 4 เครื่อง" },
        { label: "รายการที่ 2", value: "ขอขยายกำลังการผลิตเป็น 12,000 ชิ้น/วัน" },
      ],
      project: [
        { label: "ชื่อโครงการ", value: "โครงการขยายกำลังการผลิต ระยะที่ 2" },
        { label: "มูลค่าการลงทุน", value: "125,000,000 บาท" },
        { label: "ระยะเวลาดำเนินการ", value: "18 เดือน" },
      ],
    },
    attachments: [
      {
        id: "ATT-001",
        name: "สำเนาใบอนุญาตเดิม",
        fileName: "existing-license.pdf",
        sizeBytes: 1_248_000,
        uploadedAt: item.submittedAt,
        url: "/mock/existing-license.pdf",
      },
      {
        id: "ATT-002",
        name: "แผนผังโรงงาน",
        fileName: "factory-layout.pdf",
        sizeBytes: 3_920_000,
        uploadedAt: item.submittedAt,
        url: "/mock/factory-layout.pdf",
      },
      {
        id: "ATT-003",
        name: "รายงานผลกระทบสิ่งแวดล้อม",
        fileName: "eia-report.pdf",
        sizeBytes: 8_140_000,
        uploadedAt: item.submittedAt,
        url: "/mock/eia-report.pdf",
      },
    ],
    timeline: [
      {
        id: "TL-1",
        title: "ยื่นคำขอเข้าระบบ",
        actor: item.applicantName,
        at: item.submittedAt,
        status: "COMPLETED",
      },
      {
        id: "TL-2",
        title: "เจ้าหน้าที่รับเรื่องและตรวจสอบเอกสาร",
        actor: item.assignedOfficer,
        at: item.updatedAt,
        status: "COMPLETED",
      },
      {
        id: "TL-3",
        title: "รอการอนุมัติและลงนาม",
        actor: "ผู้ช่วยหัวหน้าส่วนงาน",
        at: item.updatedAt,
        status: "PENDING",
      },
    ],
  };
}
