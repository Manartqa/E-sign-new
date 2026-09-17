import type { NotificationItem } from "@/types/app/notifications";

/**
 * GET /api/notifications — not in the handoff; mirrors what the header's
 * notification panel renders until the backend defines its own shape.
 */
export type NotificationResponse = NotificationItem;
