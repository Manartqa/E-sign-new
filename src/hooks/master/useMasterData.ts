"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getApplicationTypes,
  getDecisionReasons,
  getPersonTypes,
  getPrefixes,
  getWeaponCategories,
} from "@/services/master.service";
import type { DecisionAction } from "@/types/app/applications";
import type { MasterOption } from "@/types/app/master";

export const MASTER_QUERY_KEY = ["master"] as const;

/** master data barely changes, so it is fetched once per session */
const useMasterList = (key: string, queryFn: () => Promise<MasterOption[]>) => {
  const { data, isLoading } = useQuery({
    queryKey: [...MASTER_QUERY_KEY, key],
    queryFn,
    staleTime: Infinity,
  });

  return { options: data ?? [], isLoading };
};

export const useApplicationTypes = () =>
  useMasterList("applicationTypes", getApplicationTypes);

export const useDecisionReasons = (action: DecisionAction) =>
  useMasterList(`decisionReasons:${action}`, () => getDecisionReasons(action));

export const useWeaponCategories = () =>
  useMasterList("weaponCategories", getWeaponCategories);

export const usePersonTypes = () => useMasterList("personTypes", getPersonTypes);

export const usePrefixes = () => useMasterList("prefixes", getPrefixes);
