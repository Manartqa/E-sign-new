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
  /** ช่วงวันที่รับเรื่อง — inclusive ISO bounds, both optional */
  dateFrom?: string;
  dateTo?: string;
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

export interface ApplicationField {
  label: string;
  value: string;
}

/** A row of the attached-documents table (Figma 83:3204). */
export interface DocumentItem {
  id: string;
  name: string;
  /** วันที่เอกสาร (ISO) */
  documentDate: string;
  /** วันหมดอายุ (ISO) */
  expiryDate: string;
  /** สถานที่ออกเอกสาร */
  issuedPlace: string;
  fileUrl: string;
}

export interface DetailSection {
  title: string;
  fields: ApplicationField[];
}

/** One authorised signer on the บุคคลและผู้มีอำนาจ tab (Figma 49:491). */
export interface AuthorizedPerson {
  id: string;
  name: string;
  /** ตำแหน่ง — e.g. กรรมการผู้จัดการ, ผู้ถือหุ้น */
  role: string;
  /** เลขที่บัตรประจำตัวประชาชน */
  nationalId: string;
  documents: DocumentItem[];
}

export interface DetailTableColumn {
  key: string;
  label: string;
  width?: string;
  /** render this column's cells bold navy (e.g. the name column) */
  strong?: boolean;
}

/**
 * The eight detail tabs render four distinct panel shapes in Figma
 * (tabs-content 106:7034): label/value sections, a data table, a card grid,
 * and a timeline. Panels are data-driven so a tab's content can change with
 * the backend without touching a component.
 */
export type DetailPanel =
  | { kind: "fields"; sections: DetailSection[]; documents?: DocumentItem[] }
  | {
      kind: "table";
      heading?: string;
      columns: DetailTableColumn[];
      rows: Record<string, string>[];
    }
  | { kind: "cards"; cards: DetailSection[] }
  | { kind: "people"; heading: string; people: AuthorizedPerson[] }
  | {
      kind: "documents";
      heading: string;
      /** name + file only, no date/place columns */
      compact?: boolean;
      documents: DocumentItem[];
    }
  | { kind: "timeline"; events: TimelineEvent[] };

/**
 * Tab labels are taken from the tab bar itself, not the frame names — they
 * disagree (the frame `app-detail/รายการที่ขออนุญาต` renders the tab
 * `รายการอาวุธ/วัตถุดิบ`). The bar is what a user actually reads.
 */
export const DETAIL_TABS = [
  { key: "applicant", label: "ข้อมูลผู้ยื่น/บริษัท" },
  { key: "factory", label: "ข้อมูลโรงงาน" },
  { key: "people", label: "บุคคลและผู้มีอำนาจ" },
  { key: "buildings", label: "อาคารและสถานที่" },
  { key: "permits", label: "รายการอาวุธ/วัตถุดิบ" },
  { key: "project", label: "ข้อมูลโครงการ" },
  { key: "docs", label: "เอกสารแนบอื่นๆ" },
  { key: "history", label: "ประวัติการดำเนินการ" },
] as const;

export type DetailTabKey = (typeof DETAIL_TABS)[number]["key"];

/** The `ข้อมูลคำขอ` summary card above the tabs (Figma 156:1991). */
export interface ApplicationSummary {
  /** ประเภทใบอนุญาต */
  licenseType: string;
  /** เลขรับคำขอ */
  requestNo: string;
  /** วันที่ยื่นคำขอ (ISO) */
  submittedAt: string;
  /** เลขที่รับเรื่อง */
  receiptNo: string;
  /** วันที่รับเรื่อง (ISO) */
  receivedAt: string;
  /** เลขที่นำเรียน */
  submissionNo: string;
  /** วันที่นำเรียน (ISO) */
  submissionDate: string;
  /** ผู้ประกอบการ */
  operatorName: string;
  status: ApplicationStatus;
  /** ตัวอย่างใบอนุญาต — opens the PDF viewer (Phase 5B) */
  licensePreviewUrl?: string;
}

export interface ApplicationDetail extends ApplicationItem {
  summary: ApplicationSummary;
  panels: Record<DetailTabKey, DetailPanel>;
}

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
