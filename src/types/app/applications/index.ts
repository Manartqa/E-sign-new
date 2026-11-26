import type { SortParams } from "@/types/app/common";
import type {
  ApplicationStatus,
  MY_TURN_FILTER,
  REJECTED_OR_RETURNED_FILTER,
} from "@/constant/status";

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
  /**
   * ด่วน — flagged by the originating system, never set here. Urgent requests
   * are pinned above everything else on both list pages so they are decided
   * first; see getApplicationList.
   */
  isUrgent: boolean;
  /**
   * Whether the signed-in officer is the LAST signer on this request. The
   * final signature must be made with a USB token; earlier signers confirm
   * with a button. Decided by the backend, which owns the approval chain.
   */
  isFinalSigner: boolean;
  /**
   * The signed-in officer's own step on this request's signing chain, or null
   * when they are not on it. Request `status` says where the request stands;
   * this says where the officer stands — a request still รอการอนุมัติ may
   * already carry their approval, or not have reached them yet.
   */
  myStep: MyStep | null;
  /**
   * Whether the officer may approve / reject / return this request now:
   * their step is MY_TURN on a request still รอการอนุมัติ. Signing runs in
   * step order, so the backend decides this and refuses the action otherwise
   * (legacy: "รายการนี้ลงนามแล้ว หรือยังไม่ถึงลำดับการลงนาม").
   */
  canAct: boolean;
  /** ส่งไปยัง/ขายให้กับ — buyer or destination; null when the type has none */
  buyerName: string | null;
  /** วันที่คำขอ — the date on the request document (ISO) */
  documentDate: string;
  /** หมายเหตุด่วน — why the originating system flagged it ด่วน; null otherwise */
  urgentRemark: string | null;
}

/** Where the signed-in officer's own step stands. */
export const MY_STEP_STATUS = {
  /** an earlier step has not approved yet */
  WAITING_PREVIOUS: "WAITING_PREVIOUS",
  /** every earlier step approved — the officer decides now */
  MY_TURN: "MY_TURN",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RETURNED: "RETURNED",
} as const;
export type MyStepStatus = (typeof MY_STEP_STATUS)[keyof typeof MY_STEP_STATUS];

export interface MyStep {
  /** 1-based position on the chain */
  stepNo: number;
  status: MyStepStatus;
  /** ISO; null until the officer decides */
  decidedAt: string | null;
  /** หมายเหตุ the officer wrote with their decision */
  remark: string | null;
}

export interface ApplicationStats {
  total: number;
  /** waiting for the signed-in officer's decision now — see MY_TURN_FILTER */
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

export interface ApplicationListParams extends SortParams {
  keyword?: string;
  status?:
    | ApplicationStatus
    | typeof REJECTED_OR_RETURNED_FILTER
    | typeof MY_TURN_FILTER
    | "all";
  type?: string | "all";
  /** `only` keeps just the ด่วน rows; they are pinned on top either way */
  urgent?: "all" | "only";
  /**
   * ผลการพิจารณาของฉัน — the legacy "ดูคำขอที่ลงนาม" view: requests by what
   * the signed-in officer's own step decided. `DECIDED` = any decision.
   */
  myDecision?: "all" | "DECIDED" | "APPROVED" | "REJECTED" | "RETURNED";
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
  /** null while the step hasn't happened yet — a pending signer has no time */
  at: string | null;
  /**
   * COMPLETED and PENDING are the two states Figma draws. REJECTED and
   * RETURNED are ours: a signing chain can stop at a signer who did not
   * approve, and a green tick would read as if they had.
   */
  status: "COMPLETED" | "PENDING" | "REJECTED" | "RETURNED";
  /**
   * ครั้งที่ — the submission round the event belongs to. A request sent back
   * and resubmitted starts a new round on a fresh copy of its chain (legacy
   * REVISION_NO); intake events belong to their round too.
   */
  revisionNo: number;
  /** signing steps only: 1-based position on the chain */
  stepNo?: number;
  /** signing steps only: the signer's ระดับการอนุมัติ ("1"–"19" or REVIEW_AND_SIGN) */
  approvalLevel?: string;
  /** signing steps only: the หมายเหตุ written with the decision */
  remark?: string;
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
  /** render this column's cells bold navy (e.g. the name column) */
  strong?: boolean;
}

/**
 * The eight detail tabs render four distinct panel shapes in Figma
 * (tabs-content 106:7034): label/value sections, a data table, a card grid,
 * and a timeline. Panels are data-driven so a tab's content can change with
 * the backend without touching a component.
 */
export type DetailPanel = (
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
  | { kind: "timeline"; heading?: string; events: TimelineEvent[] }
) & {
  /**
   * The tab's label for this request, where it depends on the request type —
   * the `transfer` tab reads ข้อมูลการขนย้าย on อ.9 but ข้อมูลการส่งออก on
   * อ.14. Unset: the DETAIL_TABS label.
   */
  tabLabel?: string;
};

/**
 * Tab labels are taken from the tab bar itself, not the frame names — they
 * disagree (the frame `app-detail/รายการที่ขออนุญาต` renders the tab
 * `รายการอาวุธ/วัตถุดิบ`). The bar is what a user actually reads.
 */
export const DETAIL_TABS = [
  { key: "applicant", label: "ข้อมูลผู้ยื่น/บริษัท" },
  { key: "factory", label: "ข้อมูลโรงงาน" },
  { key: "people", label: "บุคคลและผู้มีอำนาจ" },
  // not in Figma — legacy sections (user's call, 2026-11-26): the move / sale
  // details of อ.9, อ.15 and อ.14 (labelled per type through `tabLabel`) …
  { key: "transfer", label: "ข้อมูลการขนย้าย/จำหน่าย" },
  { key: "buildings", label: "อาคารและสถานที่" },
  { key: "permits", label: "รายการอาวุธ/วัตถุดิบ" },
  { key: "project", label: "ข้อมูลโครงการ" },
  { key: "docs", label: "เอกสารแนบอื่นๆ" },
  // … and the legacy RequestInfo tab ผลการตรวจสอบ
  { key: "checks", label: "ผลการตรวจสอบ" },
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
  /**
   * One panel per tab, keyed by DETAIL_TABS. Partial on purpose: a request
   * type that has no factory or project section simply omits that key, and
   * the tab renders an empty state instead of breaking.
   */
  panels: Partial<Record<DetailTabKey, DetailPanel>>;
}

export type ActionMode = "approve" | "reject" | "return";

export interface SignFormValues {
  certificateId: string;
  certificateOwner: string;
  notes: string;
}

/** ไม่อนุมัติ / ส่งคืนเพื่อแก้ไข — the two decisions that are not a signature */
export type DecisionAction = "REJECT" | "RETURN";

export interface ReturnFormValues {
  /** a `value` from the decision-reason master list */
  reasonCode: string;
  notes: string;
}
