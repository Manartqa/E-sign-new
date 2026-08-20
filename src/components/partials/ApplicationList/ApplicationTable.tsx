"use client";

import Link from "next/link";
import { Eye, FileText, Pencil, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  RelativeTime,
  StatusBadge,
} from "@/components/common";
import { ROUTES } from "@/constant/routes";
import { formatThaiShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApplicationItem } from "@/types/app/applications";
import { TABLE_COLUMNS } from "./ApplicationList.config";

interface ApplicationTableProps {
  items: ApplicationItem[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  isError: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onPageChange: (page: number) => void;
}

const CELL = "border-r px-3 py-3 align-middle";

/** Figma: app-list › table (171:1843) — 10 columns */
export function ApplicationTable({
  items,
  total,
  page,
  limit,
  isLoading,
  isError,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPageChange,
}: ApplicationTableProps) {
  if (isError) return <ErrorState />;
  if (isLoading) return <LoadingState rows={limit} />;
  if (items.length === 0) return <EmptyState />;

  const allSelected = items.every((item) => selectedIds.includes(item.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full border-collapse text-left">
          <thead className="border-b bg-[#f8fafc]">
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    CELL,
                    column.width,
                    "text-base font-bold whitespace-nowrap text-brand-navy-mid",
                  )}
                >
                  {column.key === "select" ? (
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={onToggleSelectAll}
                      aria-label="เลือกทั้งหมด"
                      className="size-4 rounded-[3px]"
                    />
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b bg-white hover:bg-[#f8fafc]">
                <td className={CELL}>
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => onToggleSelect(item.id)}
                    aria-label={"เลือกคำขอ " + item.requestNo}
                    className="size-4 rounded-[3px]"
                  />
                </td>
                <td
                  className={cn(
                    CELL,
                    "text-[13px] font-bold text-brand-navy-mid",
                  )}
                >
                  {item.typeName}
                </td>
                <td
                  className={cn(
                    CELL,
                    "text-sm whitespace-nowrap text-muted-foreground",
                  )}
                >
                  {item.requestNo}
                </td>
                <td
                  className={cn(
                    CELL,
                    "text-sm whitespace-nowrap text-muted-foreground",
                  )}
                >
                  {item.receiptNo}
                </td>
                <td
                  className={cn(
                    CELL,
                    "text-sm whitespace-nowrap text-muted-foreground",
                  )}
                >
                  {formatThaiShortDate(item.receivedAt)}
                </td>
                <td className={cn(CELL, "text-sm text-muted-foreground")}>
                  {item.operatorName}
                </td>
                <td className={CELL}>
                  <StatusBadge status={item.status} />
                </td>
                <td
                  className={cn(
                    CELL,
                    "text-[13px] whitespace-nowrap text-slate-400",
                  )}
                >
                  <RelativeTime iso={item.updatedAt} />
                </td>
                <td className={cn(CELL, "text-sm text-muted-foreground")}>
                  {item.assignedOfficer}
                </td>
                <td className={CELL}>
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={ROUTES.applicationDetail(item.id)}
                      aria-label={"ดูรายละเอียด " + item.requestNo}
                      className="text-muted-foreground hover:text-brand-navy-mid"
                    >
                      <Eye className="size-[18px]" aria-hidden />
                    </Link>
                    {/* edit / return / pdf are driven from the detail page — Phase 5 */}
                    <Pencil className="size-[18px] text-slate-300" aria-hidden />
                    <RotateCcw
                      className="size-[18px] text-slate-300"
                      aria-hidden
                    />
                    <FileText
                      className="size-[18px] text-slate-300"
                      aria-hidden
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}
