import { APPLICATION_STATUS } from "@/constant/status";
import type { ReportSummary } from "@/types/app/reports";

const NOW = Date.now();
const HOUR = 3_600_000;

/** Bar heights are the Figma design's (8:336), scaled back to counts. */
export const MOCK_REPORT_SUMMARY: ReportSummary = {
  kpis: [
    { key: "total", label: "คำขอทั้งหมด", value: 1247, deltaPercent: 12 },
    { key: "approved", label: "อนุมัติแล้ว", value: 942, deltaPercent: 8 },
    { key: "pending", label: "รอดำเนินการ", value: 263, deltaPercent: -5 },
    { key: "rejected", label: "ปฏิเสธ/ส่งคืน", value: 42, deltaPercent: 2 },
  ],

  byMonth: [
    { label: "ม.ค.", value: 84 },
    { label: "ก.พ.", value: 126 },
    { label: "มี.ค.", value: 105 },
    { label: "เม.ย.", value: 168 },
    { label: "พ.ค.", value: 217, highlighted: true },
    { label: "มิ.ย.", value: 98 },
    { label: "ก.ค.", value: 84 },
    { label: "ส.ค.", value: 140 },
    { label: "ก.ย.", value: 196 },
    { label: "ต.ค.", value: 182 },
    { label: "พ.ย.", value: 154 },
    { label: "ธ.ค.", value: 133 },
  ],

  byLicenseType: [
    { label: "ใบอนุญาตประกอบกิจการโรงงานฯ (อ.1)", percent: 32 },
    { label: "ใบอนุญาตประกอบกิจการโรงงานฯ (อ.3)", percent: 24 },
    {
      label: "อนุญาตเปลี่ยนแปลงกรรมการ ผู้ถือหุ้น ผู้จัดการหรือเปลี่ยนชื่อโรงงาน",
      percent: 18,
    },
    { label: "อนุญาตเปิดดำเนินกิจการโรงงานผลิตอาวุธ", percent: 14 },
    { label: "อื่นๆ", percent: 12 },
  ],

  recentSignatures: [
    {
      id: "SIG-1",
      licenseName: "ใบอนุญาตประกอบกิจการโรงงานผลิตอาวุธ (อ.1)",
      officer: "มานัส ประทุมชู",
      status: APPLICATION_STATUS.APPROVED,
      at: new Date(NOW - 2 * HOUR).toISOString(),
    },
    {
      id: "SIG-2",
      licenseName: "คำขออนุญาตขายหรือจำหน่ายในราชอาณาจักร (อ.15)",
      officer: "ส.อ.หญิง พิชารภรณ์ ผดุงขวัญ",
      status: APPLICATION_STATUS.APPROVED,
      at: new Date(NOW - 6 * HOUR).toISOString(),
    },
    {
      id: "SIG-3",
      licenseName: "อนุญาตเปลี่ยนแปลงกรรมการ ผู้ถือหุ้น ผู้จัดการ",
      officer: "นางสาวมาลี รักงาน",
      status: APPLICATION_STATUS.RETURNED,
      at: new Date(NOW - 26 * HOUR).toISOString(),
    },
    {
      id: "SIG-4",
      licenseName: "อนุญาตเปิดดำเนินกิจการโรงงานผลิตอาวุธ",
      officer: "นายประสิทธิ์ ตั้งใจ",
      status: APPLICATION_STATUS.REJECTED,
      at: new Date(NOW - 50 * HOUR).toISOString(),
    },
    {
      id: "SIG-5",
      licenseName: "ใบอนุญาตประกอบกิจการโรงงานฯ (อ.3)",
      officer: "นางสุดา ทองดี",
      status: APPLICATION_STATUS.APPROVED,
      at: new Date(NOW - 74 * HOUR).toISOString(),
    },
  ],
};

export const FISCAL_YEAR_OPTIONS = ["2569", "2568", "2567"];
export const QUARTER_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "1", label: "ไตรมาส 1" },
  { value: "2", label: "ไตรมาส 2" },
  { value: "3", label: "ไตรมาส 3" },
  { value: "4", label: "ไตรมาส 4" },
];
export const REPORT_TYPE_OPTIONS = [
  { value: "summary", label: "สรุปยอดคำขอ" },
  { value: "by-officer", label: "แยกตามเจ้าหน้าที่" },
  { value: "by-type", label: "แยกตามประเภทใบอนุญาต" },
];
