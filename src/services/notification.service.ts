import dayjs from "dayjs";
import { USE_MOCK } from "@/lib/env";
import {
  getNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "@/lib/api/api-main";
import { MOCK_NOTIFICATIONS } from "@/mocks/notifications.mock";
import type { NotificationItem } from "@/types/app/notifications";

/**
 * ── Backend swap point ────────────────────────────────────────────────────
 * Mock branches mutate MOCK_NOTIFICATIONS in memory, so read state survives
 * navigation but resets on a page reload.
 */

/**
 * Unread notifications always show; a read one stays only for the rest of the
 * (local) day it was read on. Applied to both branches, so the rule holds even
 * if the backend returns everything.
 */
function isVisible(item: NotificationItem, startOfToday: dayjs.Dayjs) {
  if (!item.read) return true;
  // no readAt from the backend: keep it rather than silently drop it
  return !item.readAt || !dayjs(item.readAt).isBefore(startOfToday);
}

/** newest first */
export async function getNotifications(): Promise<NotificationItem[]> {
  let items: NotificationItem[];
  if (USE_MOCK) {
    items = [...MOCK_NOTIFICATIONS];
  } else {
    const res = await getNotificationsApi();
    items = res.data.data;
  }
  const startOfToday = dayjs().startOf("day");
  return items
    .filter((item) => isVisible(item, startOfToday))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (USE_MOCK) {
    const item = MOCK_NOTIFICATIONS.find((n) => n.id === id);
    if (item && !item.read) {
      item.read = true;
      item.readAt = new Date().toISOString();
    }
    return;
  }
  await markNotificationReadApi(id);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (USE_MOCK) {
    const now = new Date().toISOString();
    MOCK_NOTIFICATIONS.forEach((n) => {
      if (n.read) return;
      n.read = true;
      n.readAt = now;
    });
    return;
  }
  await markAllNotificationsReadApi();
}
