"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  detectSigningToken,
  signWithToken,
} from "@/services/signingToken.service";

export const SIGNING_TOKEN_QUERY_KEY = ["signingToken"] as const;

/** `enabled` = only probe for a token when this signature needs one */
export const useSigningToken = (enabled: boolean) => {
  const detection = useQuery({
    queryKey: SIGNING_TOKEN_QUERY_KEY,
    queryFn: detectSigningToken,
    enabled,
    retry: false,
  });

  const sign = useMutation({ mutationFn: signWithToken });

  return {
    token: detection.data ?? null,
    isDetecting: detection.isFetching,
    detectError: detection.error,
    redetect: () => void detection.refetch(),
    sign,
  };
};
