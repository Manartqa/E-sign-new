"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  DateRangePicker,
  FILTER_TRIGGER,
  LabeledSelect,
} from "@/components/common";
import { STATUS_OPTIONS } from "@/constant/status";
import { APPLICATION_TYPE_OPTIONS } from "@/mocks/applications.mock";
import type { ApplicationListParams } from "@/types/app/applications";

interface ApplicationListHeaderProps {
  filters: ApplicationListParams;
  onApply: (next: ApplicationListParams) => void;
  onReset: () => void;
  /** the pending route pins the status, so its dropdown is hidden */
  lockStatus?: boolean;
}

/**
 * Figma: app-list › filter card (6:330).
 *
 * The design's fourth control, `ช่วงวันที่`, filters on วันที่รับเรื่อง. The
 * handoff API table has no date-range parameter, so `dateFrom`/`dateTo` are
 * this app's own names — confirm them when the real endpoint lands.
 */
export function ApplicationListHeader({
  filters,
  onApply,
  onReset,
  lockStatus = false,
}: ApplicationListHeaderProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => setDraft(filters), [filters]);

  const typeOptions = useMemo(
    () => [{ value: "all", label: "ทุกประเภท" }, ...APPLICATION_TYPE_OPTIONS],
    [],
  );
  const statusOptions = useMemo(
    () => [{ value: "all", label: "ทั้งหมด" }, ...STATUS_OPTIONS],
    [],
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply({ ...draft, page: 1 });
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 lg:flex-row lg:items-end"
    >
      <div className="flex flex-col gap-1.5 lg:w-80">
        <label htmlFor="keyword" className="text-sm font-medium text-[#334155]">
          ค้นหา
        </label>
        <div className="flex items-center gap-2.5 rounded-lg border bg-white p-2.5">
          <Search
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <input
            id="keyword"
            value={draft.keyword ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, keyword: e.target.value }))
            }
            placeholder="ค้นหาผู้ประกอบการ, เลขที่คำขอ..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <LabeledSelect
          label="ประเภท"
          className="flex-1"
          labelClassName="text-[#334155]"
          triggerClassName={FILTER_TRIGGER}
          value={draft.type ?? "all"}
          options={typeOptions}
          onChange={(value) => setDraft((d) => ({ ...d, type: value }))}
        />

        {!lockStatus && (
          <LabeledSelect
            label="สถานะ"
            className="flex-1"
            labelClassName="text-[#334155]"
            triggerClassName={FILTER_TRIGGER}
            value={draft.status ?? "all"}
            options={statusOptions}
            onChange={(value) =>
              setDraft((d) => ({
                ...d,
                status: value as ApplicationListParams["status"],
              }))
            }
          />
        )}

        <div className="flex flex-1 flex-col gap-1.5">
          <span className="text-sm font-medium text-[#334155]">ช่วงวันที่</span>
          <DateRangePicker
            value={{ from: draft.dateFrom, to: draft.dateTo }}
            onChange={(range) =>
              setDraft((d) => ({
                ...d,
                dateFrom: range.from ?? "",
                dateTo: range.to ?? "",
              }))
            }
            triggerClassName="h-[42px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-brand-navy-mid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover"
        >
          ค้นหา
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-navy-mid hover:bg-secondary"
        >
          รีเซ็ต
        </button>
      </div>
    </form>
  );
}
