"use client";

import { useQuery } from "@tanstack/react-query";
import { getNotifications } from "@/services/notification.service";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export const useNotifications = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
  });

  const notifications = data ?? [];
  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    isLoading,
    isError,
  };
};
