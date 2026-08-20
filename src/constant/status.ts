/**
 * Application status — single source of truth.
 *
 * Reconciled from the Figma `Status Badge` component (6 variants), which is
 * the only place in the design with real UI for every state. The
 * `developer-handoff` frame lists a different 5-code set
 * (PENDING_REVIEW / IN_REVIEW / PENDING_SIGNATURE / APPROVED / REJECTED) and
 * its sample JSON uses PENDING_APPROVAL — both are superseded here.
 * Revisit when the real backend contract lands.
 */

export const APPLICATION_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_SIGNATURE: "PENDING_SIGNATURE",
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
  IN_PROGRESS: {
    label: "อยู่ระหว่างดำเนินการ",
    className: "bg-status-in-progress-bg text-status-in-progress-fg",
    dotClassName: "bg-status-in-progress-fg",
  },
  PENDING_SIGNATURE: {
    label: "รอการลงนาม",
    className:
      "bg-status-pending-signature-bg text-status-pending-signature-fg",
    dotClassName: "bg-status-pending-signature-fg",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    className: "bg-status-approved-bg text-status-approved-fg",
    dotClassName: "bg-status-approved-fg",
  },
  REJECTED: {
    label: "ปฏิเสธ",
    className: "bg-status-rejected-bg text-status-rejected-fg",
    dotClassName: "bg-status-rejected-fg",
  },
  RETURNED: {
    label: "ส่งคืนแก้ไข",
    className: "bg-status-returned-bg text-status-returned-fg",
    dotClassName: "bg-status-returned-fg",
  },
};

/** Options for the status filter dropdown, in display order. */
export const STATUS_OPTIONS = (
  Object.keys(STATUS_META) as ApplicationStatus[]
).map((value) => ({ value, label: STATUS_META[value].label }));
