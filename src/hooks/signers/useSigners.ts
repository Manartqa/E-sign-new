"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSigner,
  checkSignerCertificate,
  deleteSigner,
  getPositions,
  getSigner,
  getSigners,
  updateSigner,
} from "@/services/signer.service";
import { SIGNING_WORKFLOWS_QUERY_KEY } from "@/hooks/signingWorkflows";
import type { SignerInput, SignerListParams } from "@/types/app/signers";

export const SIGNERS_QUERY_KEY = ["signers"] as const;

export const useSignerList = (params: SignerListParams) => {
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [...SIGNERS_QUERY_KEY, "list", params],
    queryFn: () => getSigners(params),
    // keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isFetching,
    isError,
  };
};

export const useSigner = (id: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [...SIGNERS_QUERY_KEY, "detail", id],
    queryFn: () => getSigner(id),
    enabled: Boolean(id),
  });

  return { signer: data ?? null, isLoading, isError };
};

export const usePositions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
    staleTime: Infinity,
  });

  return { positions: data ?? [], isLoading };
};

export const useSignerActions = () => {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: SIGNERS_QUERY_KEY }),
      // workflows show each step's current signer name and position
      queryClient.invalidateQueries({ queryKey: SIGNING_WORKFLOWS_QUERY_KEY }),
    ]);

  return {
    create: useMutation({
      mutationFn: (input: SignerInput) => createSigner(input),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: SignerInput }) =>
        updateSigner(id, input),
      onSuccess,
    }),
    checkCertificate: useMutation({
      mutationFn: ({ file, pin }: { file: File; pin: string }) =>
        checkSignerCertificate(file, pin),
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteSigner(id),
      onSuccess,
    }),
  };
};
