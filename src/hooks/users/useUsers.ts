"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PROFILE_QUERY_KEY } from "@/hooks/profile";
import { getUser, getUsers, updateUserRoles } from "@/services/user.service";
import type { UserListParams } from "@/types/app/users";

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

export const useUpdateUserRoles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      updateUserRoles(id, roleIds),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
        // the signed-in user's permissions are built from these roles
        queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
      ]),
  });
};
