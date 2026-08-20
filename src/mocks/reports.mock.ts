import type { ReportSummary } from "@/types/app/reports";

export const MOCK_REPORT_SUMMARY: ReportSummary = {
  kpis: [
    { key: "total", label: "คำขอทั้งหมด", value: 47, deltaPercent: 12.5 },
    { key: "pending", label: "รอการอนุมัติ", value: 12, deltaPercent: -4.2 },
    { key: "approved", label: "อนุมัติแล้ว", value: 26, deltaPercent: 18.3 },
    { key: "avgDays", label: "ระยะเวลาเฉลี่ย (วัน)", value: 5, deltaPercent: -8.1 },
  ],
  byMonth: [
    { label: "ม.ค.", value: 12 },
    { label: "ก.พ.", value: 18 },
    { label: "มี.ค.", value: 15 },
    { label: "เม.ย.", value: 22 },
    { label: "พ.ค.", value: 27 },
    { label: "มิ.ย.", value: 19 },
    { label: "ก.ค.", value: 31 },
    { label: "ส.ค.", value: 24 },
  ],
  byStatus: [
    { label: "รอการอนุมัติ", value: 12 },
    { label: "อยู่ระหว่างดำเนินการ", value: 6 },
    { label: "รอการลงนาม", value: 3 },
    { label: "อนุมัติแล้ว", value: 20 },
    { label: "ปฏิเสธ", value: 4 },
    { label: "ส่งคืนแก้ไข", value: 2 },
  ],
  byType: [
    { label: "ใบอนุญาตประกอบกิจการโรงงาน", value: 18 },
    { label: "ใบอนุญาตขยายโรงงาน", value: 11 },
    { label: "การจดทะเบียนเครื่องจักร", value: 9 },
    { label: "ใบอนุญาตวัตถุอันตราย", value: 6 },
    { label: "ใบอนุญาตก่อสร้างอาคารโรงงาน", value: 3 },
  ],
};
