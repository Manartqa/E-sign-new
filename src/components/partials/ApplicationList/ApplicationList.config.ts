import dayjs from "dayjs";
import {
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  APPLICATION_STATUS,
  MY_TURN_FILTER,
  REJECTED_OR_RETURNED_FILTER,
} from "@/constant/status";
import type { ApplicationListParams, ApplicationStats } from "@/types/app/applications";

export const APPLICATION_LIST_STORAGE_KEY = "application-list-filters";

export const DEFAULT_FILTERS: ApplicationListParams = {
  keyword: "",
  type: "all",
  status: "all",
  urgent: "all",
  myDecision: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 10,
};

/**
 * The "รอการอนุมัติ" route reuses this partial pinned to the requests waiting
 * for this officer's decision now — see MY_TURN_FILTER.
 */
export const PENDING_FILTERS: ApplicationListParams = {
  ...DEFAULT_FILTERS,
  status: MY_TURN_FILTER,
};

/**
 * ผลการพิจารณาของฉัน — the legacy signer's "ดูคำขอที่ลงนาม" view, as a filter
 * on คำขอทั้งหมด (user's call, 2026-11-26).
 */
export const MY_DECISION_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "DECIDED", label: "ที่ฉันพิจารณาแล้ว (ทุกผล)" },
  { value: "APPROVED", label: "ฉันอนุมัติ" },
  { value: "REJECTED", label: "ฉันไม่อนุมัติ" },
  { value: "RETURNED", label: "ฉันส่งคืนเพื่อแก้ไข" },
] as const;

/** legacy signed mode opened on the last two months */
const MY_DECISION_DEFAULT_MONTHS = 2;

/**
 * Picking a ผลการพิจารณาของฉัน filter with no date range set fills ช่วงวันที่
 * with the last two months, as legacy did; a range already chosen is kept.
 */
export function withMyDecision(
  filters: ApplicationListParams,
  myDecision: NonNullable<ApplicationListParams["myDecision"]>,
  now = dayjs(),
): ApplicationListParams {
  const opensWindow =
    myDecision !== "all" && !filters.dateFrom && !filters.dateTo;
  return {
    ...filters,
    myDecision,
    ...(opensWindow && {
      dateFrom: now
        .subtract(MY_DECISION_DEFAULT_MONTHS, "month")
        .startOf("day")
        .toISOString(),
      dateTo: now.endOf("day").toISOString(),
    }),
  };
}

/** the ความเร่งด่วน dropdown — ด่วน is a flag, so there is nothing between the two */
export const URGENT_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "only", label: "เฉพาะรายการด่วน" },
] as const;

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
    // the count is "waiting for me", so the click must filter the same way
    statusFilter: MY_TURN_FILTER,
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
  // not in Figma: the legacy inbox's วันที่คำขอ and ส่งไปยัง/ขายให้กับ (user's call, 2026-11-25)
  { key: "documentDate", label: "วันที่คำขอ", width: "min-w-[116px]" },
  { key: "receiptNo", label: "เลขรับเรื่อง", width: "min-w-[116px]" },
  { key: "receivedAt", label: "วันที่รับเรื่อง", width: "min-w-[116px]" },
  { key: "operatorName", label: "ผู้ประกอบการ", width: "min-w-[280px]" },
  { key: "buyerName", label: "ส่งไปยัง/ขายให้กับ", width: "min-w-[220px]" },
  { key: "status", label: "สถานะ", width: "min-w-[144px]" },
  { key: "assignedOfficer", label: "เจ้าหน้าที่รับเรื่อง", width: "min-w-[195px]" },
  { key: "actions", label: "การดำเนินการ", width: "min-w-[155px]" },
] as const;
