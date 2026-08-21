import { APPLICATION_STATUS } from "@/constant/status";
import type { ReportSummary } from "@/types/app/reports";

const NOW = Date.now();
const HOUR = 3_600_000;

/** Bar heights are the Figma design's (8:336), scaled back to counts. */
export const MOCK_REPORT_SUMMARY: ReportSummary = {
  // fixed timestamp (not Date.now()) so SSR and client render the same string
  updatedAt: "2026-08-21T09:06:00+07:00",

  kpis: [
    {
      key: "total",
      label: "คำขอทั้งหมด",
      value: 1247,
      deltaPercent: 12,
      spark: [60, 64, 58, 70, 66, 73, 68, 79, 74, 84],
    },
    {
      key: "approved",
      label: "อนุมัติแล้ว",
      value: 942,
      deltaPercent: 8,
      spark: [48, 54, 50, 60, 57, 66, 62, 70, 68, 76],
    },
    {
      key: "pending",
      label: "รอดำเนินการ",
      value: 263,
      deltaPercent: -5,
      spark: [72, 66, 69, 60, 63, 55, 58, 50, 53, 46],
    },
    {
      key: "rejected",
      label: "ปฏิเสธ/ส่งคืน",
      value: 42,
      deltaPercent: 2,
      spark: [40, 45, 38, 49, 43, 51, 46, 53, 48, 55],
    },
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

  // every dimension sums to the 1,247 total, so the donut's centre stays right
  breakdowns: {
    // labels match TYPES in mocks/applications.mock.ts, the single source
    // for request-type names used everywhere else in the app
    licenseType: [
      {
        label: "คำขอรับใบอนุญาตประกอบกิจการโรงงานฯ (อ.1, อ.3)",
        value: 320,
      },
      { label: "คำขออนุญาตขนย้ายวัตถุหรืออาวุธฯ (อ.9)", value: 210 },
      { label: "คำขออนุญาตตั้งหรือมีคลังเก็บ (อ.4)", value: 175 },
      {
        label: "คำขออนุญาตขายหรือจำหน่ายฯ ในราชอาณาจักร (อ.15)",
        value: 160,
      },
      {
        label: "คำขออนุญาตขายหรือจำหน่ายฯ โดยการส่งออกไปนอกราชอาณาจักร (อ.14)",
        value: 140,
      },
      { label: "คำขออนุญาตเปิดดำเนินกิจการโรงงานผลิตอาวุธ", value: 110 },
      { label: "คำขออนุญาตขยายสายการผลิตอาวุธ", value: 65 },
      { label: "คำขออนุญาตเปลี่ยนแปลงโรงงาน", value: 42 },
      {
        label:
          "คำขออนุญาตเปลี่ยนแปลงกรรมการ ผู้ถือหุ้น ผู้จัดการหรือเปลี่ยนชื่อโรงงาน",
        value: 25,
      },
    ],
    division: [
      { label: "กองโรงงานอุตสาหกรรม", value: 512 },
      { label: "กองอาวุธและยุทโธปกรณ์", value: 318 },
      { label: "กองมาตรฐานและควบคุมคุณภาพ", value: 205 },
      { label: "กองนิติการ", value: 121 },
      { label: "กองแผนและงบประมาณ", value: 58 },
      { label: "กองบริหารทั่วไป", value: 33 },
    ],
    department: [
      { label: "แผนกทะเบียนใบอนุญาต", value: 288 },
      { label: "แผนกตรวจสอบโรงงาน", value: 241 },
      { label: "แผนกควบคุมยุทธภัณฑ์", value: 198 },
      { label: "แผนกวัตถุระเบิด", value: 152 },
      { label: "แผนกนิติกรรมสัญญา", value: 96 },
      { label: "แผนกมาตรฐานผลิตภัณฑ์", value: 84 },
      { label: "แผนกประเมินความปลอดภัย", value: 66 },
      { label: "แผนกทะเบียนผู้ประกอบการ", value: 52 },
      { label: "แผนกวิเคราะห์ข้อมูล", value: 38 },
      { label: "แผนกธุรการ", value: 32 },
    ],
  },

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
