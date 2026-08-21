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
import { APPLICATION_STATUS } from "@/constant/status";
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
  onLimitChange: (limit: number) => void;
}

const CELL = "border-r px-3 py-3 align-middle";

/**
 * Freezes the "การดำเนินการ" column to the right edge while the table scrolls.
 * Only the vertical divider needs redrawing: border-collapse hands the grid
 * hairlines to the <table>, so this column's LEFT border scrolls away with the
 * body — we redraw it as a single inset box-shadow (which sticks) in the exact
 * var(--border) hairline. The row's horizontal border-b is unaffected by
 * horizontal scroll, so it needs no help. To keep this line a single 1px
 * hairline (not doubled with the neighbour's border-r), the "เจ้าหน้าที่รับเรื่อง"
 * column drops its own border-r at this seam — see NO_RIGHT below.
 */
const STICKY_ACTIONS = "sticky right-0 shadow-[inset_1px_0_0_0_var(--border)]";

/** the column just before the frozen one yields the seam to STICKY_ACTIONS */
const NO_RIGHT = "border-r-0!";

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
  onLimitChange,
}: ApplicationTableProps) {
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      {isError ? (
        <ErrorState />
      ) : isLoading ? (
        <LoadingState rows={limit} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border">
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
                        column.key === "assignedOfficer" && NO_RIGHT,
                        column.key === "actions" &&
                          cn(STICKY_ACTIONS, "z-20 bg-[#f8fafc]"),
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
                  <tr
                    key={item.id}
                    className="group border-b bg-white hover:bg-[#f8fafc]"
                  >
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
                    <td
                      className={cn(
                        CELL,
                        NO_RIGHT,
                        "text-sm text-muted-foreground",
                      )}
                    >
                      {item.assignedOfficer}
                    </td>
                    <td
                      className={cn(
                        CELL,
                        STICKY_ACTIONS,
                        "z-10 bg-white group-hover:bg-[#f8fafc]",
                      )}
                    >
                      {/*
                    Figma 171:2032 colours the row actions — eye #1b3a6b,
                    edit #22c55e, rotate-ccw #ef4444 — but only while the
                    application is still open. Once it is อนุมัติแล้ว there is
                    nothing left to act on, so those icons stay muted. eye and
                    pdf are always available, so both stay navy on every
                    status.
                    (rotate-ccw is red in the design, but follows the amber
                    ส่งคืนเพื่อแก้ไข button instead, at the user's request.)
                  */}
                      {(() => {
                        const isOpen =
                          item.status !== APPLICATION_STATUS.APPROVED;

                        return (
                          <div className="flex items-center justify-end gap-4">
                            <Link
                              href={ROUTES.applicationDetail(item.id)}
                              aria-label={"ดูรายละเอียด " + item.requestNo}
                              className="text-brand-navy-mid hover:opacity-70"
                            >
                              <Eye className="size-[18px]" aria-hidden />
                            </Link>
                            {/* edit / return / pdf are driven from the detail page — Phase 5 */}
                            <Pencil
                              className={cn(
                                "size-[18px]",
                                isOpen
                                  ? "text-action-approve"
                                  : "text-slate-300",
                              )}
                              aria-hidden
                            />
                            <RotateCcw
                              className={cn(
                                "size-[18px]",
                                isOpen
                                  ? "text-action-return"
                                  : "text-slate-300",
                              )}
                              aria-hidden
                            />
                            {/* the pdf icon is always available — every status
                            can be printed — and shares the eye's navy */}
                            <FileText
                              className="size-[18px] text-brand-navy-mid"
                              aria-hidden
                            />
                          </div>
                        );
                      })()}
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
            onLimitChange={onLimitChange}
          />
        </div>
      )}
    </div>
  );
}
