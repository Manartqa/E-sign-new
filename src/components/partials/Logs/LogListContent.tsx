"use client";

import { useState, type FormEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import {
  DateRangePicker,
  EmptyState,
  ErrorState,
  FILTER_TRIGGER,
  LabeledSelect,
  LoadingState,
  Pagination,
} from "@/components/common";
import { downloadCsv, toCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import type { LogListParams, LogListResult } from "@/types/app/logs";
import type { LogColumn } from "./Logs.config";

interface LogListContentProps<T extends { id: string }> {
  title: string;
  description: string;
  /** query key root — one per log */
  queryKey: string;
  fetchLogs: (params: LogListParams) => Promise<LogListResult<T>>;
  columns: LogColumn<T>[];
  kindLabel: string;
  kindOptions: { value: string; label: string }[];
  /** CSV file name without the date, e.g. "logon-log" */
  fileName: string;
}

const EMPTY: LogListParams = { dateFrom: "", dateTo: "", keyword: "", kind: "all", page: 1, limit: 20 };

/**
 * ตั้งค่าระบบ › ประวัติการเข้าใช้งานระบบ / ประวัติการเปลี่ยนแปลงข้อมูล — not in
 * Figma. Legacy AuditLogon / AuditLog, with the date range actually applied
 * (legacy ignored it) and a CSV export of every row the filters match
 * (user's call, 2026-11-26).
 */
export function LogListContent<T extends { id: string }>({
  title,
  description,
  queryKey,
  fetchLogs,
  columns,
  kindLabel,
  kindOptions,
  fileName,
}: LogListContentProps<T>) {
  const [draft, setDraft] = useState(EMPTY);
  const [params, setParams] = useState(EMPTY);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKey, params],
    queryFn: () => fetchLogs(params),
    placeholderData: keepPreviousData,
  });

  const search = (event: FormEvent) => {
    event.preventDefault();
    setParams({ ...draft, page: 1, limit: params.limit });
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await fetchLogs({ ...params, page: 1, limit: 0 });
      downloadCsv(
        toCsv(all.items, columns),
        `${fileName}-${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } catch {
      toast.error("ส่งออกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={exporting || !data?.total}
          className="flex items-center justify-center gap-2 rounded-lg border border-brand-navy-mid px-4 py-2.5 text-sm font-semibold text-brand-navy-mid hover:bg-secondary disabled:opacity-50"
        >
          <Download className="size-4" aria-hidden />
          ส่งออก CSV
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm">
        <form onSubmit={search} className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <label htmlFor={`${queryKey}-keyword`} className="text-sm font-medium text-[#334155]">
              ค้นหา
            </label>
            <div className="flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 focus-within:border-brand-navy-mid">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                id={`${queryKey}-keyword`}
                value={draft.keyword}
                onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))}
                placeholder="ชื่อผู้ใช้งาน หรือรายการ"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <LabeledSelect
            label={kindLabel}
            className="min-w-[200px] flex-1"
            labelClassName="text-[#334155]"
            triggerClassName={FILTER_TRIGGER}
            value={draft.kind ?? "all"}
            options={kindOptions}
            onChange={(kind) => setDraft((d) => ({ ...d, kind }))}
          />
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <span className="text-sm font-medium text-[#334155]">ช่วงวันที่</span>
            <DateRangePicker
              value={{ from: draft.dateFrom, to: draft.dateTo }}
              onChange={(range) =>
                setDraft((d) => ({ ...d, dateFrom: range.from ?? "", dateTo: range.to ?? "" }))
              }
              triggerClassName="h-[42px]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-navy-mid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover"
            >
              ค้นหา
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(EMPTY);
                setParams({ ...EMPTY, limit: params.limit });
              }}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-navy-mid hover:bg-secondary"
            >
              รีเซ็ต
            </button>
          </div>
        </form>

        {isError ? (
          <ErrorState />
        ) : isLoading || !data ? (
          <LoadingState rows={8} />
        ) : data.items.length === 0 ? (
          <EmptyState title="ไม่พบรายการ" description="ลองเปลี่ยนตัวกรองแล้วค้นหาอีกครั้ง" />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full border-collapse text-left">
                <thead className="border-b bg-[#f8fafc]">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.label}
                        className="px-4 py-3 text-sm font-bold whitespace-nowrap text-brand-navy-mid"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.items.map((row) => (
                    <tr key={row.id} className="bg-white hover:bg-[#f8fafc]">
                      {columns.map((column) => (
                        <td
                          key={column.label}
                          className={cn("px-4 py-2.5 align-top text-sm text-foreground", column.className)}
                        >
                          {column.value(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={(page) => setParams((p) => ({ ...p, page }))}
              onLimitChange={(limit) => setParams((p) => ({ ...p, limit, page: 1 }))}
            />
          </>
        )}
      </div>
    </div>
  );
}
