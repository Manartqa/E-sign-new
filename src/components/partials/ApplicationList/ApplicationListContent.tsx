"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSearchPersist } from "@/hooks/common";
import {
  useApplicationList,
  useBulkApplicationActions,
} from "@/hooks/applications";
import { useProfile } from "@/hooks/profile";
import { MOCK_CERTIFICATE } from "@/components/partials/ApplicationDetail/ApplicationDetail.config";
import type {
  ActionMode,
  ApplicationListParams,
} from "@/types/app/applications";
import { ApplicationBulkBar } from "./ApplicationBulkBar";
import { BulkConfirmModal } from "./BulkConfirmModal";
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

  const filters = filterValues as ApplicationListParams;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<ActionMode | null>(null);

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

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );

  const confirmBulk = async () => {
    if (!bulkAction) return;

    const ids = selectedIds;
    const verb =
      bulkAction === "approve"
        ? "อนุมัติและลงนาม"
        : bulkAction === "reject"
          ? "ปฏิเสธ"
          : "ส่งคืนเพื่อแก้ไข";

    try {
      const { succeeded, failed } = await bulkRun.mutateAsync({
        ids,
        action: bulkAction,
        officerId: profile?.id ?? "",
        certificate: { id: MOCK_CERTIFICATE.id, owner: profile?.name ?? "" },
      });

      if (failed.length) {
        toast.warning(
          `${verb}สำเร็จ ${succeeded.length} รายการ ไม่สำเร็จ ${failed.length} รายการ`,
        );
      } else {
        toast.success(`${verb} ${succeeded.length} รายการเรียบร้อยแล้ว`);
      }

      // keep only the rows that could not be processed, so a retry is one click
      setSelectedIds(failed);
    } catch {
      toast.error("ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBulkAction(null);
    }
  };

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      items.every((item) => prev.includes(item.id))
        ? []
        : items.map((item) => item.id),
    );

  return (
    <div className="flex flex-col gap-6">
      <ApplicationStatCards />

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
        onPageChange={(nextPage) =>
          applyFilters({ ...filters, page: nextPage })
        }
        onLimitChange={(nextLimit) =>
          applyFilters({ ...filters, limit: nextLimit, page: 1 })
        }
      />

      <BulkConfirmModal
        action={bulkAction}
        count={selectedIds.length}
        isSubmitting={bulkRun.isPending}
        onClose={() => setBulkAction(null)}
        onConfirm={() => void confirmBulk()}
      />
    </div>
  );
}
