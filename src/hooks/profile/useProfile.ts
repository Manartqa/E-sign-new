"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/profile.service";

export const PROFILE_QUERY_KEY = ["profile"] as const;

export const useProfile = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
  });

  return { profile: data ?? null, isLoading, isError, error };
};
