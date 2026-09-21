"use client";

import { useQuery } from "@tanstack/react-query";
import { getReportOptions } from "@/services/report.service";

export const useReportOptions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["reportOptions"],
    queryFn: getReportOptions,
    staleTime: Infinity,
  });

  return {
    fiscalYears: data?.fiscalYears ?? [],
    reportTypes: data?.reportTypes ?? [],
    isLoading,
  };
};
