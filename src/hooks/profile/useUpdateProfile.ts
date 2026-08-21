"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "@/services/profile.service";
import type { UserProfile } from "@/types/app/profile";
import { PROFILE_QUERY_KEY } from "./useProfile";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => updateProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updated);
    },
  });
};
