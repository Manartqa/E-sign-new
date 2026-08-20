import type { ApplicationStatus } from "@/constant/status";

/**
 * One row of the application table.
 *
 * The columns come from the Figma table (171:1843), which does NOT match the
 * `developer-handoff` sample JSON: the table shows a Thai-format
 * `เลขที่คำขอ` ("40/2569") plus `เลขรับเรื่อง` and `วันที่รับเรื่อง`, none of
 * which appear in the handoff contract. `id` is kept as the internal routing
 * key (it is never displayed).
 */
export interface ApplicationItem {
  /** internal id, used for the detail route — not shown in the table */
  id: string;
  type: string;
  /** ประเภทคำขอ */
  typeName: string;
  /** เลขที่คำขอ — Thai running number, e.g. "40/2569" */
  requestNo: string;
  /** เลขรับเรื่อง — e.g. "อ01424/2569" */
  receiptNo: string;
  /** วันที่รับเรื่อง (ISO) */
  receivedAt: string;
  /** ผู้ประกอบการ — the company on the application */
  operatorName: string;
  /** ผู้ยื่นคำขอ — the person, shown on the detail page */
  applicantName: string;
  applicantNationalId: string;
  status: ApplicationStatus;
  submittedAt: string;
  /** วันที่อัปเดต — rendered as relative time ("2 ชม. ที่แล้ว") */
  updatedAt: string;
  /** เจ้าหน้าที่รับเรื่อง */
  assignedOfficer: string;
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejectedOrReturned: number;
}

export interface ApplicationListResult {
  items: ApplicationItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplicationListParams {
  keyword?: string;
  status?: ApplicationStatus | "all";
  type?: string | "all";
  page?: number;
  limit?: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  actor: string;
  at: string;
  status: "COMPLETED" | "PENDING";
}

export interface Attachment {
  id: string;
  name: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;
}

export interface ApplicationField {
  label: string;
  value: string;
}

export interface ApplicationDetail extends ApplicationItem {
  sections: Record<string, ApplicationField[]>;
  attachments: Attachment[];
  timeline: TimelineEvent[];
}

/** The 8 detail tabs, in Figma order. */
export const DETAIL_TABS = [
  { key: "applicant", label: "ข้อมูลผู้ยื่น-บริษัท" },
  { key: "factory", label: "ข้อมูลโรงงาน" },
  { key: "persons", label: "บุคคลและผู้มีอำนาจ" },
  { key: "buildings", label: "อาคารและสถานที่" },
  { key: "requestedItems", label: "รายการที่ขออนุญาต" },
  { key: "project", label: "ข้อมูลโครงการ" },
  { key: "attachments", label: "เอกสารแนบอื่นๆ" },
  { key: "history", label: "ประวัติการดำเนินการ" },
] as const;

export type DetailTabKey = (typeof DETAIL_TABS)[number]["key"];

export type ActionMode = "approve" | "reject" | "return";

export interface SignFormValues {
  certificateId: string;
  certificateOwner: string;
  notes: string;
}

export interface ReturnFormValues {
  reason: string;
  notes: string;
}
