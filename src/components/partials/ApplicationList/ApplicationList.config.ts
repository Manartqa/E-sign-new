import {
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  APPLICATION_STATUS,
  REJECTED_OR_RETURNED_FILTER,
} from "@/constant/status";
import type { ApplicationListParams, ApplicationStats } from "@/types/app/applications";

export const APPLICATION_LIST_STORAGE_KEY = "application-list-filters";

export const DEFAULT_FILTERS: ApplicationListParams = {
  keyword: "",
  type: "all",
  status: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 10,
};

/** The "รอการอนุมัติ" route reuses this partial with the status pinned. */
export const PENDING_FILTERS: ApplicationListParams = {
  ...DEFAULT_FILTERS,
  status: APPLICATION_STATUS.PENDING_APPROVAL,
};

export interface StatCardDef {
  key: keyof ApplicationStats;
  label: string;
  icon: LucideIcon;
  /** solid accent behind the (always white) icon — matches the Reports page's KPI cards */
  circleClassName: string;
  /** the status filter clicking this card applies to the table below */
  statusFilter: NonNullable<ApplicationListParams["status"]>;
}

/** Same visual style as the Reports page's KPI cards (ReportsContent's KPI_META). */
export const STAT_CARDS: StatCardDef[] = [
  {
    key: "total",
    label: "คำขอทั้งหมด",
    icon: FileText,
    circleClassName: "bg-brand-navy-mid",
    statusFilter: "all",
  },
  {
    key: "pending",
    label: "รอการอนุมัติ",
    icon: Clock,
    circleClassName: "bg-action-return",
    statusFilter: APPLICATION_STATUS.PENDING_APPROVAL,
  },
  {
    key: "approved",
    label: "อนุมัติ",
    icon: CheckCircle2,
    circleClassName: "bg-action-approve",
    statusFilter: APPLICATION_STATUS.APPROVED,
  },
  {
    key: "rejectedOrReturned",
    label: "ไม่อนุมัติ/ส่งกลับแก้ไข",
    icon: XCircle,
    circleClassName: "bg-action-reject",
    statusFilter: REJECTED_OR_RETURNED_FILTER,
  },
];

/** Column widths are the Figma table's (171:1843), kept as min-widths. */
export const TABLE_COLUMNS = [
  { key: "select", label: "", width: "w-12" },
  { key: "typeName", label: "ประเภทคำขอ", width: "min-w-[346px]" },
  { key: "requestNo", label: "เลขที่คำขอ", width: "min-w-[104px]" },
  { key: "receiptNo", label: "เลขรับเรื่อง", width: "min-w-[116px]" },
  { key: "receivedAt", label: "วันที่รับเรื่อง", width: "min-w-[116px]" },
  { key: "operatorName", label: "ผู้ประกอบการ", width: "min-w-[280px]" },
  { key: "status", label: "สถานะ", width: "min-w-[144px]" },
  { key: "assignedOfficer", label: "เจ้าหน้าที่รับเรื่อง", width: "min-w-[195px]" },
  { key: "actions", label: "การดำเนินการ", width: "min-w-[155px]" },
] as const;
