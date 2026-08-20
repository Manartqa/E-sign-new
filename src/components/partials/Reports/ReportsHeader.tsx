"use client";

import { useEffect, useState } from "react";
import { Table } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FISCAL_YEAR_OPTIONS,
  QUARTER_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from "@/mocks/reports.mock";
import type { ReportParams } from "@/types/app/reports";

interface ReportsHeaderProps {
  filters: ReportParams;
  onApply: (next: ReportParams) => void;
  onExport: () => void;
}

/** Figma: reports-dashboard › filter bar (8:285) */
export function ReportsHeader({
  filters,
  onApply,
  onExport,
}: ReportsHeaderProps) {
  const [draft, setDraft] = useState(filters);
  useEffect(() => setDraft(filters), [filters]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6 lg:flex-row lg:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-black">ปีงบประมาณ</label>
        <Select
          value={draft.fiscalYear}
          onValueChange={(value) =>
            setDraft((d) => ({ ...d, fiscalYear: value ?? undefined }))
          }
        >
          <SelectTrigger className="w-full rounded-lg border p-2.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FISCAL_YEAR_OPTIONS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-black">ไตรมาส</label>
        <Select
          value={draft.quarter}
          onValueChange={(value) =>
            setDraft((d) => ({ ...d, quarter: value ?? undefined }))
          }
        >
          <SelectTrigger className="w-full rounded-lg border p-2.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUARTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-black">
          ประเภทรายงาน
        </label>
        <Select
          value={draft.reportType}
          onValueChange={(value) =>
            setDraft((d) => ({ ...d, reportType: value ?? undefined }))
          }
        >
          <SelectTrigger className="w-full rounded-lg border p-2.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-brand-navy-mid px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-navy-hover"
        >
          ออกรายงาน
        </button>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg bg-action-approve px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <Table className="size-4" aria-hidden />
          ส่งออก Excel
        </button>
      </div>
    </form>
  );
}
