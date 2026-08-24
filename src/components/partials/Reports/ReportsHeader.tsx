"use client";

import { useState } from "react";
import { Table } from "lucide-react";
import { FILTER_TRIGGER, LabeledSelect } from "@/components/common";
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

  // Same pattern as ApplicationListHeader: re-sync the draft during render
  // when the applied filters change from the outside, never in an effect.
  const [appliedFilters, setAppliedFilters] = useState(filters);
  if (appliedFilters !== filters) {
    setAppliedFilters(filters);
    setDraft(filters);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 lg:flex-row lg:items-end"
    >
      <LabeledSelect
        label="ปีงบประมาณ"
        className="flex-1"
        labelClassName="text-[#334155]"
        triggerClassName={FILTER_TRIGGER}
        value={draft.fiscalYear ?? ""}
        options={FISCAL_YEAR_OPTIONS.map((year) => ({
          value: year,
          label: year,
        }))}
        onChange={(value) => setDraft((d) => ({ ...d, fiscalYear: value }))}
      />

      <LabeledSelect
        label="ไตรมาส"
        className="flex-1"
        labelClassName="text-[#334155]"
        triggerClassName={FILTER_TRIGGER}
        value={draft.quarter ?? "all"}
        options={QUARTER_OPTIONS}
        onChange={(value) => setDraft((d) => ({ ...d, quarter: value }))}
      />

      <LabeledSelect
        label="ประเภทรายงาน"
        className="flex-1"
        labelClassName="text-[#334155]"
        triggerClassName={FILTER_TRIGGER}
        value={draft.reportType ?? "summary"}
        options={REPORT_TYPE_OPTIONS}
        onChange={(value) => setDraft((d) => ({ ...d, reportType: value }))}
      />

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
