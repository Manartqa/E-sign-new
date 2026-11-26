"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveApplication,
  decideApplication,
  type ApproveInput,
} from "@/services/application.service";
import type { DecisionRequest } from "@/types/api/main/application";
import { APPLICATION_DETAIL_QUERY_KEY } from "./useApplicationDetail";
import { APPLICATION_LIST_QUERY_KEY } from "./useApplicationList";
import { APPLICATION_STATS_QUERY_KEY } from "./useApplicationStats";

export const useApplicationActions = (id: string) => {
  const queryClient = useQueryClient();

  // refetch after a failure too: "already signed" / "not your turn yet" means
  // what is on screen is stale, and the fresh state hides the buttons
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
    onSettled: invalidate,
  });

  const approve = useMutation({
    mutationFn: (input: ApproveInput) => approveApplication(id, input),
    onSettled: invalidate,
  });

  return { decide, approve };
};
