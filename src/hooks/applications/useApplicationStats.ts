"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplicationStats } from "@/services/application.service";

export const APPLICATION_STATS_QUERY_KEY = ["applicationStats"] as const;

/** `enabled` = false skips the request, e.g. for a user who can't see requests */
export const useApplicationStats = (enabled = true) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: APPLICATION_STATS_QUERY_KEY,
    queryFn: getApplicationStats,
    enabled,
  });

  return { stats: data ?? null, isLoading, isError };
};
