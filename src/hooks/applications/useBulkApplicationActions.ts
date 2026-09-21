"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  decideApplication,
  signApplication,
} from "@/services/application.service";
import { signWithToken } from "@/services/signingToken.service";
import type { ActionMode } from "@/types/app/applications";
import { APPLICATION_LIST_QUERY_KEY } from "./useApplicationList";
import { APPLICATION_STATS_QUERY_KEY } from "./useApplicationStats";

interface BulkActionInput {
  ids: string[];
  action: ActionMode;
  /** officer note carried on every request in the batch */
  notes?: string;
  officerId: string;
  /** only needed by `approve`, which goes through the sign endpoint */
  certificate?: { id: string; owner: string };
  /** the selected ids this officer signs last — they go through the token */
  finalSignerIds?: string[];
  /** USB token PIN, entered once for the whole batch */
  pin?: string;
}

export interface BulkActionResult {
  succeeded: string[];
  failed: string[];
  /** the first failure's message, e.g. a wrong token PIN */
  error?: string;
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
      officerId,
      certificate,
      finalSignerIds = [],
      pin,
    }) => {
      const result: BulkActionResult = { succeeded: [], failed: [] };

      for (const id of ids) {
        try {
          if (action === "approve") {
            // rows this officer signs last go through the USB token, exactly
            // as the detail page does; the rest keep the stand-in certificate
            const token =
              pin && finalSignerIds.includes(id)
                ? await signWithToken({ applicationId: id, pin })
                : undefined;
            await signApplication(id, {
              certificateId: token?.certificateId ?? certificate?.id ?? "",
              certificateOwner:
                token?.certificateOwner ?? certificate?.owner ?? "",
              signature: token?.signature ?? "base64_encoded_signature",
              timestamp: new Date().toISOString(),
              applicationId: id,
              officerId,
              notes: notes ?? "",
            });
          } else {
            // a batch collects no reason — see BulkConfirmModal
            await decideApplication(id, {
              action: action === "reject" ? "REJECT" : "RETURN",
              reasonCode: "",
              notes: notes ?? "",
            });
          }
          result.succeeded.push(id);
        } catch (error) {
          result.failed.push(id);
          result.error ??=
            error instanceof Error ? error.message : undefined;
        }
      }

      return result;
    },
    onSuccess: () => {
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
