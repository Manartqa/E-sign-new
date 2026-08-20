"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplicationStats } from "@/services/application.service";

export const APPLICATION_STATS_QUERY_KEY = ["applicationStats"] as const;

export const useApplicationStats = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: APPLICATION_STATS_QUERY_KEY,
    queryFn: getApplicationStats,
  });

  return { stats: data ?? null, isLoading, isError };
};
