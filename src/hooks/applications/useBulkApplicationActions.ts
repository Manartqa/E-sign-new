"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveApplication,
  signApplication,
} from "@/services/application.service";
import type { ActionMode } from "@/types/app/applications";
import { APPLICATION_LIST_QUERY_KEY } from "./useApplicationList";

interface BulkActionInput {
  ids: string[];
  action: ActionMode;
  /** officer note carried on every request in the batch */
  notes?: string;
  officerId: string;
  /** only needed by `approve`, which goes through the sign endpoint */
  certificate?: { id: string; owner: string };
}

export interface BulkActionResult {
  succeeded: string[];
  failed: string[];
}

/**
 * Bulk approve / reject / return for the selected table rows.
 *
 * There is no batch endpoint yet, so this fans out over the same per-request
 * calls the detail page uses and reports partial failures instead of throwing
 * — one bad row must not hide the rows that did go through.
 */
export const useBulkApplicationActions = () => {
  const queryClient = useQueryClient();

  const run = useMutation<BulkActionResult, Error, BulkActionInput>({
    mutationFn: async ({ ids, action, notes, officerId, certificate }) => {
      const result: BulkActionResult = { succeeded: [], failed: [] };

      for (const id of ids) {
        try {
          if (action === "approve") {
            await signApplication(id, {
              certificateId: certificate?.id ?? "",
              certificateOwner: certificate?.owner ?? "",
              signature: "base64_encoded_signature",
              timestamp: new Date().toISOString(),
              applicationId: id,
              officerId,
              notes: notes ?? "",
            });
          } else {
            await approveApplication(id, { notes: notes ?? "", officerId });
          }
          result.succeeded.push(id);
        } catch {
          result.failed.push(id);
        }
      }

      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: APPLICATION_LIST_QUERY_KEY,
      });
    },
  });

  return { run };
};
