"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSigningWorkflow,
  deleteSigningWorkflow,
  getSigningWorkflow,
  getSigningWorkflows,
  updateSigningWorkflow,
} from "@/services/signingWorkflow.service";
import type {
  SigningWorkflowInput,
  SigningWorkflowListParams,
} from "@/types/app/signingWorkflows";

export const SIGNING_WORKFLOWS_QUERY_KEY = ["signingWorkflows"] as const;

export const useSigningWorkflowList = (params: SigningWorkflowListParams) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [...SIGNING_WORKFLOWS_QUERY_KEY, "list", params],
    queryFn: () => getSigningWorkflows(params),
    // keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError,
  };
};

export const useSigningWorkflow = (id: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [...SIGNING_WORKFLOWS_QUERY_KEY, "detail", id],
    queryFn: () => getSigningWorkflow(id),
    enabled: Boolean(id),
  });

  return { workflow: data ?? null, isLoading, isError };
};

export const useSigningWorkflowActions = () => {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    queryClient.invalidateQueries({ queryKey: SIGNING_WORKFLOWS_QUERY_KEY });

  return {
    create: useMutation({
      mutationFn: (input: SigningWorkflowInput) => createSigningWorkflow(input),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: SigningWorkflowInput }) =>
        updateSigningWorkflow(id, input),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteSigningWorkflow(id),
      onSuccess,
    }),
  };
};
