"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  approveApplication,
  decideApplication,
} from "@/services/application.service";
import type { BulkRowResult, SignMethod } from "@/types/api/main/application";
import type { ActionMode } from "@/types/app/applications";
import { APPLICATION_LIST_QUERY_KEY } from "./useApplicationList";
import { APPLICATION_STATS_QUERY_KEY } from "./useApplicationStats";

interface BulkActionInput {
  ids: string[];
  action: ActionMode;
  /** หมายเหตุ / รายละเอียด carried on every request in the batch */
  notes: string;
  /** reject / return: the one reason applied to every request */
  reasonCode?: string;
  officerId: string;
  /** approve: the selected ids this officer signs last */
  finalSignerIds?: string[];
  /** approve: how those rows are signed — the rest are confirmed */
  finalMethod?: SignMethod;
  /** USB token PIN, entered once for the whole batch */
  pin?: string;
}

export interface BulkActionResult {
  succeeded: string[];
  failed: string[];
  /** the first failure's message, e.g. a wrong token PIN */
  error?: string;
  /** every row's outcome in selection order — the batch endpoint's shape */
  results: BulkRowResult[];
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
    mutationFn: async ({
      ids,
      action,
      notes,
      reasonCode = "",
      officerId,
      finalSignerIds = [],
      finalMethod = "CONFIRM",
      pin,
    }) => {
      const result: BulkActionResult = {
        succeeded: [],
        failed: [],
        results: [],
      };

      for (const id of ids) {
        try {
          if (action === "approve") {
            await approveApplication(id, {
              method: finalSignerIds.includes(id) ? finalMethod : "CONFIRM",
              pin,
              notes,
              officerId,
            });
          } else {
            await decideApplication(id, {
              action: action === "reject" ? "REJECT" : "RETURN",
              reasonCode,
              notes,
            });
          }
          result.succeeded.push(id);
          result.results.push({ id, ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : undefined;
          result.failed.push(id);
          result.results.push({ id, ok: false, message });
          result.error ??= message;
        }
      }

      return result;
    },
    // a failed row is likely stale (already decided, not this officer's turn)
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: APPLICATION_LIST_QUERY_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: APPLICATION_STATS_QUERY_KEY,
      });
    },
  });

  return { run };
};
