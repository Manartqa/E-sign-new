"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
 * The design's fourth control, `ช่วงวันที่`, is rendered disabled: neither the
 * handoff API table nor the mock service exposes a date-range parameter, so
 * there is nothing to filter on yet. Wire it up when the backend adds one.
 */
export function ApplicationListHeader({
  filters,
  onApply,
  onReset,
  lockStatus = false,
}: ApplicationListHeaderProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => setDraft(filters), [filters]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply({ ...draft, page: 1 });
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6 lg:flex-row lg:items-end"
    >
      <div className="flex flex-col gap-1.5 lg:w-80">
        <label htmlFor="keyword" className="text-sm font-medium text-[#334155]">
          ค้นหา
        </label>
        <div className="flex items-center gap-2.5 rounded-lg border bg-[#f8fafc] p-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            id="keyword"
            value={draft.keyword ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))}
            placeholder="ค้นหาชื่อผู้ยื่น, เลขที่คำขอ..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium text-[#334155]">ประเภท</label>
          <Select
            value={draft.type ?? "all"}
            onValueChange={(value) =>
              setDraft((d) => ({ ...d, type: value ?? "all" }))
            }
          >
            <SelectTrigger className="w-full rounded-lg border bg-[#f8fafc]">
              <SelectValue placeholder="ทุกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกประเภท</SelectItem>
              {APPLICATION_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!lockStatus && (
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-[#334155]">สถานะ</label>
            <Select
              value={draft.status ?? "all"}
              onValueChange={(value) =>
                setDraft((d) => ({
                  ...d,
                  status: (value ?? "all") as ApplicationListParams["status"],
                }))
              }
            >
              <SelectTrigger className="w-full rounded-lg border bg-[#f8fafc]">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium text-[#334155]">ช่วงวันที่</label>
          <button
            type="button"
            disabled
            title="ยังไม่รองรับ — รอ API รับพารามิเตอร์ช่วงวันที่"
            className="flex items-center justify-between rounded-lg border bg-[#f8fafc] p-2.5 text-sm text-slate-400"
          >
            เลือกช่วงวันที่
            <CalendarDays className="size-3.5" aria-hidden />
          </button>
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
