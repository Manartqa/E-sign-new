import {
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { APPLICATION_STATUS } from "@/constant/status";
import type { ApplicationListParams, ApplicationStats } from "@/types/app/applications";

export const APPLICATION_LIST_STORAGE_KEY = "application-list-filters";

export const DEFAULT_FILTERS: ApplicationListParams = {
  keyword: "",
  type: "all",
  status: "all",
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
  /** icon tile tint — 8% of the accent, per Figma 6:294 */
  tileClassName: string;
  iconClassName: string;
}

/** Figma: app-list › stat-card ×4 (6:293) */
export const STAT_CARDS: StatCardDef[] = [
  {
    key: "total",
    label: "คำขอทั้งหมด",
    icon: FileText,
    tileClassName: "bg-brand-navy-mid/8",
    iconClassName: "text-brand-navy-mid",
  },
  {
    key: "pending",
    label: "รอการอนุมัติ",
    icon: Clock,
    tileClassName: "bg-action-return/8",
    iconClassName: "text-action-return",
  },
  {
    key: "approved",
    label: "อนุมัติแล้ว",
    icon: CheckCircle2,
    tileClassName: "bg-action-approve/8",
    iconClassName: "text-action-approve",
  },
  {
    key: "rejectedOrReturned",
    label: "ปฏิเสธ/ส่งคืน",
    icon: XCircle,
    tileClassName: "bg-action-reject/8",
    iconClassName: "text-action-reject",
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
  { key: "updatedAt", label: "วันที่อัปเดต", width: "min-w-[117px]" },
  { key: "assignedOfficer", label: "เจ้าหน้าที่รับเรื่อง", width: "min-w-[195px]" },
  { key: "actions", label: "การดำเนินการ", width: "min-w-[155px]" },
] as const;
