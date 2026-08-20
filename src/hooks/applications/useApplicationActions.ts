"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveApplication,
  signApplication,
} from "@/services/application.service";
import type { ApproveRequest, SignRequest } from "@/types/api/main/application";
import { APPLICATION_DETAIL_QUERY_KEY } from "./useApplicationDetail";
import { APPLICATION_LIST_QUERY_KEY } from "./useApplicationList";

export const useApplicationActions = (id: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: [...APPLICATION_DETAIL_QUERY_KEY, id],
    });
    void queryClient.invalidateQueries({
      queryKey: APPLICATION_LIST_QUERY_KEY,
    });
  };

  const approve = useMutation({
    mutationFn: (body: ApproveRequest) => approveApplication(id, body),
    onSuccess: invalidate,
  });

  const sign = useMutation({
    mutationFn: (body: SignRequest) => signApplication(id, body),
    onSuccess: invalidate,
  });

  return { approve, sign };
};
