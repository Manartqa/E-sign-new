"use client";

import { useQuery } from "@tanstack/react-query";
import { getSignatureReport } from "@/services/report.service";
import type { SignatureReportParams } from "@/types/app/reports";

export const SIGNATURE_REPORT_QUERY_KEY = ["signatureReport"] as const;

/** `params` = null until the officer runs the report with valid filters */
export const useSignatureReport = (params: SignatureReportParams | null) => {
  const { data, isFetching, isError } = useQuery({
    queryKey: [...SIGNATURE_REPORT_QUERY_KEY, params],
    queryFn: () => getSignatureReport(params!),
    enabled: params !== null,
  });
  return { rows: data ?? null, isFetching, isError };
};
