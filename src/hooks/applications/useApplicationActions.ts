"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  decideApplication,
  signApplication,
} from "@/services/application.service";
import type { DecisionRequest, SignRequest } from "@/types/api/main/application";
import { APPLICATION_DETAIL_QUERY_KEY } from "./useApplicationDetail";
import { APPLICATION_LIST_QUERY_KEY } from "./useApplicationList";
import { APPLICATION_STATS_QUERY_KEY } from "./useApplicationStats";

export const useApplicationActions = (id: string) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: [...APPLICATION_DETAIL_QUERY_KEY, id],
    });
    void queryClient.invalidateQueries({
      queryKey: APPLICATION_LIST_QUERY_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: APPLICATION_STATS_QUERY_KEY,
    });
  };

  const decide = useMutation({
    mutationFn: (body: DecisionRequest) => decideApplication(id, body),
    onSuccess: invalidate,
  });

  const sign = useMutation({
    mutationFn: (body: SignRequest) => signApplication(id, body),
    onSuccess: invalidate,
  });

  return { decide, sign };
};
