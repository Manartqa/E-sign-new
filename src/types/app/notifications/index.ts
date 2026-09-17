/**
 * Not in Figma or the handoff — the header bell had no design or data, so
 * these kinds are chosen to match the approval workflow.
 */
export const NOTIFICATION_TYPE = {
  /** a new application is waiting for this officer's signature */
  NEW_REQUEST: "NEW_REQUEST",
  /** an application sent back for edits has been resubmitted */
  RESUBMITTED: "RESUBMITTED",
  /** a signature finished and the licence reached the records system */
  SIGNED: "SIGNED",
  /** the officer's signing certificate is close to expiry */
  CERTIFICATE_EXPIRING: "CERTIFICATE_EXPIRING",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** set when the notification is about one application — opens its detail */
  applicationId?: string;
  /** ISO */
  createdAt: string;
  read: boolean;
  /** ISO — when it was read; a read notification is hidden from the next day on */
  readAt?: string;
}
