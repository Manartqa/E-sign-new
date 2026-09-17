"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import { NOTIFICATIONS_QUERY_KEY } from "./useNotifications";

export const useNotificationActions = () => {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess,
  });
  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess,
  });

  return { markRead, markAllRead };
};
