"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplicationList } from "@/services/application.service";
import type { ApplicationListParams } from "@/types/app/applications";

export const APPLICATION_LIST_QUERY_KEY = ["applicationList"] as const;

export const useApplicationList = (params?: ApplicationListParams) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...APPLICATION_LIST_QUERY_KEY, params],
    queryFn: () => getApplicationList(params),
  });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 10,
    isLoading,
    isError,
    error,
    refetch,
  };
};
