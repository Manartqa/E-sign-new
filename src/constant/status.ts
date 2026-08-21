/**
 * Application status — single source of truth.
 *
 * Trimmed to the 4 statuses the product actually uses (plus the "ทั้งหมด"
 * filter option, which isn't a real status and is added separately by
 * ApplicationListHeader). Revisit when the real backend contract lands.
 */

export const APPLICATION_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RETURNED: "RETURNED",
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export interface StatusMeta {
  /** Thai label rendered inside the badge */
  label: string;
  /** Tailwind classes for the badge pill (bg + text + dot) */
  className: string;
  dotClassName: string;
}

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  PENDING_APPROVAL: {
    label: "รอการอนุมัติ",
    className:
      "bg-status-pending-approval-bg text-status-pending-approval-fg",
    dotClassName: "bg-status-pending-approval-fg",
  },
  APPROVED: {
    label: "อนุมัติ",
    className: "bg-status-approved-bg text-status-approved-fg",
    dotClassName: "bg-status-approved-fg",
  },
  REJECTED: {
    label: "ไม่อนุมัติ",
    className: "bg-status-rejected-bg text-status-rejected-fg",
    dotClassName: "bg-status-rejected-fg",
  },
  RETURNED: {
    label: "ส่งกลับแก้ไข",
    className: "bg-status-returned-bg text-status-returned-fg",
    dotClassName: "bg-status-returned-fg",
  },
};

/** Options for the status filter dropdown, in display order. */
export const STATUS_OPTIONS = (
  Object.keys(STATUS_META) as ApplicationStatus[]
).map((value) => ({ value, label: STATUS_META[value].label }));

/**
 * Not a real status — the "ไม่อนุมัติ/ส่งกลับแก้ไข" stat card combines two
 * statuses, so clicking it needs a filter value the dropdown never offers.
 */
export const REJECTED_OR_RETURNED_FILTER = "REJECTED_OR_RETURNED" as const;
