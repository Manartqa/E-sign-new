"use client";

import { useMutation } from "@tanstack/react-query";
import { changePassword } from "@/services/profile.service";
import type { ChangePasswordRequest } from "@/types/api/main/user";

export const useChangePassword = () =>
  useMutation({
    mutationFn: (body: ChangePasswordRequest) => changePassword(body),
  });
