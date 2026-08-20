import type { ApplicationStatus } from "@/constant/status";

export interface ApplicationItem {
  id: string;
  type: string;
  typeName: string;
  applicantName: string;
  applicantNationalId: string;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  assignedOfficer: string;
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
