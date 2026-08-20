"use client";

import { useState } from "react";
import { useSearchPersist } from "@/hooks/common";
import { useApplicationList } from "@/hooks/applications";
import type { ApplicationListParams } from "@/types/app/applications";
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
  const defaults = (
    isPending ? PENDING_FILTERS : DEFAULT_FILTERS
  ) as Record<string, unknown>;

  const { filterValues, persist, reset } = useSearchPersist(
    `${APPLICATION_LIST_STORAGE_KEY}-${variant}`,
    defaults,
  );

  const filters = filterValues as ApplicationListParams;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { items, total, page, limit, isLoading, isError } =
    useApplicationList(filters);

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
        onPageChange={(nextPage) => applyFilters({ ...filters, page: nextPage })}
      />
    </div>
  );
}
