"use client";

import { useCallback } from "react";
import type { PermissionKey } from "@/types/app/roles";
import { useProfile } from "./useProfile";

/**
 * `can(key)` for hiding what the signed-in user may not do. Everything is
 * denied until the profile arrives, so check `isLoading` before treating a
 * `false` as "forbidden" rather than "not known yet".
 */
export const usePermission = () => {
  const { profile, isLoading } = useProfile();
  const permissions = profile?.permissions;

  const can = useCallback(
    (key: PermissionKey) => permissions?.includes(key) ?? false,
    [permissions],
  );

  return { can, isLoading };
};
