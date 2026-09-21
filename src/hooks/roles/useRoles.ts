"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "@/hooks/profile";
import { USERS_QUERY_KEY } from "@/hooks/users";
import {
  createRole,
  deleteRole,
  getRole,
  getRoles,
  updateRole,
} from "@/services/role.service";
import type { RoleInput, RoleListParams } from "@/types/app/roles";

export const ROLES_QUERY_KEY = ["roles"] as const;

export const useRoleList = (params: RoleListParams) => {
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [...ROLES_QUERY_KEY, "list", params],
    queryFn: () => getRoles(params),
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

export const useRole = (id: string) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [...ROLES_QUERY_KEY, "detail", id],
    queryFn: () => getRole(id),
    enabled: Boolean(id),
  });

  return { role: data ?? null, isLoading, isError };
};

export const useRoleActions = () => {
  const queryClient = useQueryClient();
  // users list role names, and the signed-in user's permissions come from them
  const onSuccess = () =>
    Promise.all(
      [ROLES_QUERY_KEY, USERS_QUERY_KEY, PROFILE_QUERY_KEY].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );

  return {
    create: useMutation({
      mutationFn: (input: RoleInput) => createRole(input),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: RoleInput }) =>
        updateRole(id, input),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteRole(id),
      onSuccess,
    }),
  };
};
