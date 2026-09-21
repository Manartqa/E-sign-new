"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "@/hooks/profile";
import { SIGNING_WORKFLOWS_QUERY_KEY } from "@/hooks/signingWorkflows";
import {
  checkCertificate,
  createUser,
  deleteUser,
  getPositions,
  getUser,
  getUsers,
  updateUser,
} from "@/services/user.service";
import type { UserInput, UserListParams } from "@/types/app/users";

export const USERS_QUERY_KEY = ["users"] as const;

export const useUserList = (params: UserListParams) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [...USERS_QUERY_KEY, "list", params],
    queryFn: () => getUsers(params),
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

export const useUser = (id: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [...USERS_QUERY_KEY, "detail", id],
    queryFn: () => getUser(id),
    enabled: Boolean(id),
  });

  return { user: data ?? null, isLoading, isError };
};

export const usePositions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: getPositions,
    staleTime: Infinity,
  });

  return { positions: data ?? [], isLoading };
};

export const useUserActions = () => {
  const queryClient = useQueryClient();
  const onSuccess = () =>
    Promise.all(
      [
        USERS_QUERY_KEY,
        // workflows show each step's current signer name and position
        SIGNING_WORKFLOWS_QUERY_KEY,
        // the signed-in user's permissions are built from their roles
        PROFILE_QUERY_KEY,
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  return {
    create: useMutation({
      mutationFn: (input: UserInput) => createUser(input),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UserInput }) =>
        updateUser(id, input),
      onSuccess,
    }),
    checkCertificate: useMutation({
      mutationFn: ({ file, pin }: { file: File; pin: string }) =>
        checkCertificate(file, pin),
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteUser(id),
      onSuccess,
    }),
  };
};
