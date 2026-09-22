"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { SIGNING_AGENT_POLL_MS } from "@/constant/signingAgent";
import {
  detectSigningAgent,
  detectSigningToken,
  launchSigningAgent,
  signWithToken,
} from "@/services/signingToken.service";

export const SIGNING_AGENT_QUERY_KEY = ["signingAgent"] as const;
export const SIGNING_TOKEN_QUERY_KEY = ["signingToken"] as const;

/**
 * `enabled` = only probe when this signature needs the token. The agent is
 * looked for first; until it is ready it is looked for again every couple of
 * seconds, so the dialog moves on by itself once the installer has run.
 */
export const useSigningToken = (enabled: boolean) => {
  const agent = useQuery({
    queryKey: SIGNING_AGENT_QUERY_KEY,
    queryFn: detectSigningAgent,
    enabled,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === "ready" ? false : SIGNING_AGENT_POLL_MS,
  });
  const agentReady = agent.data?.status === "ready";

  const detection = useQuery({
    queryKey: SIGNING_TOKEN_QUERY_KEY,
    queryFn: detectSigningToken,
    enabled: enabled && agentReady,
    retry: false,
  });

  const sign = useMutation({ mutationFn: signWithToken });

  return {
    /** null while the first look for the agent is still running */
    agent: agent.data ?? null,
    launchAgent: launchSigningAgent,
    token: agentReady ? (detection.data ?? null) : null,
    isDetecting: detection.isFetching,
    detectError: detection.error,
    redetect: () => void detection.refetch(),
    sign,
  };
};
