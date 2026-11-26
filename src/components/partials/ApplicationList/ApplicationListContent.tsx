"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchPersist } from "@/hooks/common";
import {
  useApplicationList,
  useBulkApplicationActions,
} from "@/hooks/applications";
import { useProfile } from "@/hooks/profile";
import { signMethodFor } from "@/lib/sign-method";
import { nextSort } from "@/lib/sort";
import {
  ReturnForEditModal,
  SignatureModal,
} from "@/components/partials/ApplicationDetail/Modal";
import type {
  ActionMode,
  ApplicationListParams,
} from "@/types/app/applications";
import { ApplicationBulkBar } from "./ApplicationBulkBar";
import { BulkResultModal, type BulkFailure } from "./BulkResultModal";
import { ApplicationListHeader } from "./ApplicationListHeader";
import { ApplicationStatCards } from "./ApplicationStatCards";
import { ApplicationTable } from "./ApplicationTable";
import {
  APPLICATION_LIST_STORAGE_KEY,
  DEFAULT_FILTERS,
  PENDING_FILTERS,
} from "./ApplicationList.config";

interface ApplicationListContentProps {
  /** `pending` pins status=PENDING_APPROVAL and hides the status dropdown */
  variant?: "all" | "pending";
}

export default function ApplicationListContent({
  variant = "all",
}: ApplicationListContentProps) {
  const isPending = variant === "pending";
  const defaults = (isPending ? PENDING_FILTERS : DEFAULT_FILTERS) as Record<
    string,
    unknown
  >;

  const { filterValues, persist, reset } = useSearchPersist(
    `${APPLICATION_LIST_STORAGE_KEY}-${variant}`,
    defaults,
  );

  // the pending route is always pinned, even over filters saved before the pin changed
  const filters = useMemo(
    () =>
      (isPending
        ? { ...filterValues, status: PENDING_FILTERS.status }
        : filterValues) as ApplicationListParams,
    [isPending, filterValues],
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<ActionMode | null>(null);
  /** the last batch's failure message, e.g. a wrong token PIN */
  const [bulkError, setBulkError] = useState<string>();
  /** a batch where some rows failed — shown until dismissed */
  const [bulkResult, setBulkResult] = useState<{
    verb: string;
    succeeded: number;
    failures: BulkFailure[];
  } | null>(null);

  const { items, total, page, limit, isLoading, isError } =
    useApplicationList(filters);
  const { profile } = useProfile();
  const { run: bulkRun } = useBulkApplicationActions();

  const applyFilters = (next: ApplicationListParams) => {
    // the pending route must never lose its pinned status
    const merged = isPending
      ? { ...next, status: PENDING_FILTERS.status }
      : next;
    persist("", merged as Record<string, unknown>);
    setSelectedIds([]);
  };

  // a remembered page can outlive its rows (requests got decided since) —
  // an empty page past the end has no pager to get back, so jump to the last
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const pastTheEnd =
    !isLoading && page === filters.page && items.length === 0 && page > lastPage;
  useEffect(() => {
    if (pastTheEnd) persist("", { ...filters, page: lastPage });
  }, [pastTheEnd, filters, lastPage, persist]);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );

  // selection never outlives a page change, so every selected id is on
  // `items`; rows this officer signs last are signed by their own method
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const finalSignerIds = selectedItems
    .filter((item) => item.isFinalSigner)
    .map((item) => item.id);

  const confirmBulk = async (input: {
    pin?: string;
    notes: string;
    reasonCode?: string;
  }) => {
    if (!bulkAction) return;

    const ids = selectedIds;
    setBulkError(undefined);
    const verb =
      bulkAction === "approve"
        ? "อนุมัติและลงนาม"
        : bulkAction === "reject"
          ? "ไม่อนุมัติ"
          : "ส่งคืนเพื่อแก้ไข";

    try {
      const { succeeded, failed, error, results } = await bulkRun.mutateAsync({
        ids,
        action: bulkAction,
        notes: input.notes,
        reasonCode: input.reasonCode,
        officerId: profile?.id ?? "",
        finalSignerIds,
        // the modal offers approval only when this resolves to a method
        finalMethod:
          signMethodFor(true, profile?.signingMethod) ?? undefined,
        pin: input.pin,
      });

      // keep only the rows that could not be processed, so a retry is one click
      setSelectedIds(failed);

      // nothing went through — a wrong PIN, most likely, so keep the modal up
      // with the message instead of making them start the batch over
      if (succeeded.length === 0 && error && bulkAction === "approve") {
        setBulkError(error);
        return;
      }
      setBulkAction(null);

      if (failed.length) {
        setBulkResult({
          verb,
          succeeded: succeeded.length,
          failures: results
            .filter((row) => !row.ok)
            .map((row) => ({
              requestNo:
                items.find((item) => item.id === row.id)?.requestNo ?? row.id,
              message: row.message,
            })),
        });
      } else {
        toast.success(`${verb} ${succeeded.length} รายการเรียบร้อยแล้ว`);
      }
    } catch {
      toast.error("ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setBulkAction(null);
    }
  };

  // bulk actions (approve/reject/return) only apply where it is this officer's
  // turn, so "select all" only ever selects those rows on this page
  const toggleSelectAll = () => {
    const actionableIds = items
      .filter((item) => item.canAct)
      .map((item) => item.id);
    setSelectedIds((prev) =>
      actionableIds.length > 0 && actionableIds.every((id) => prev.includes(id))
        ? []
        : actionableIds,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <ApplicationStatCards
        activeStatus={filters.status}
        onSelectStatus={(status) => applyFilters({ ...filters, status, page: 1 })}
        showActiveRing={!isPending}
      />

      <ApplicationListHeader
        filters={filters}
        onApply={applyFilters}
        onReset={() => {
          reset();
          setSelectedIds([]);
        }}
        lockStatus={isPending}
      />

      <ApplicationBulkBar
        count={selectedIds.length}
        isSubmitting={bulkRun.isPending}
        onAction={setBulkAction}
        onClear={() => setSelectedIds([])}
      />

      <ApplicationTable
        items={items}
        total={total}
        page={page}
        limit={limit}
        isLoading={isLoading}
        isError={isError}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        sort={filters}
        onSort={(key) =>
          applyFilters({ ...filters, ...nextSort(filters, key), page: 1 })
        }
        onPageChange={(nextPage) =>
          applyFilters({ ...filters, page: nextPage })
        }
        onLimitChange={(nextLimit) =>
          applyFilters({ ...filters, limit: nextLimit, page: 1 })
        }
      />

      {/* อนุมัติและลงนาม signs, so it uses the detail page's own signing
          screen; mounted only while open so the PIN never survives a close */}
      {bulkAction === "approve" && (
        <SignatureModal
          open
          details={selectedItems}
          isSubmitting={bulkRun.isPending}
          error={bulkError}
          onClose={() => setBulkAction(null)}
          onConfirm={(input) => void confirmBulk(input)}
        />
      )}

      {/* one reason and detail for the whole batch — legacy required a
          remark on every rejection */}
      {(bulkAction === "reject" || bulkAction === "return") && (
        <ReturnForEditModal
          open
          mode={bulkAction}
          count={selectedIds.length}
          isSubmitting={bulkRun.isPending}
          onClose={() => setBulkAction(null)}
          onConfirm={(values) => void confirmBulk(values)}
        />
      )}

      {bulkResult && (
        <BulkResultModal {...bulkResult} onClose={() => setBulkResult(null)} />
      )}
    </div>
  );
}
