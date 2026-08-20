"use client";

import { useQuery } from "@tanstack/react-query";
import { getReportSummary } from "@/services/report.service";
import type { ReportParams } from "@/types/app/reports";

export const REPORT_SUMMARY_QUERY_KEY = ["reportSummary"] as const;

export const useReportSummary = (params?: ReportParams) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...REPORT_SUMMARY_QUERY_KEY, params],
    queryFn: () => getReportSummary(params),
  });

  return { summary: data ?? null, isLoading, isError, error };
};
