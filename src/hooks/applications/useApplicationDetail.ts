"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplicationDetail } from "@/services/application.service";

export const APPLICATION_DETAIL_QUERY_KEY = ["applicationDetail"] as const;

export const useApplicationDetail = (id: string) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...APPLICATION_DETAIL_QUERY_KEY, id],
    queryFn: () => getApplicationDetail(id),
    enabled: Boolean(id),
  });

  return { detail: data ?? null, isLoading, isError, error, refetch };
};
