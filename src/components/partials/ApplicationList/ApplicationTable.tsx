"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, RotateCcw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  PdfIcon,
  StatusBadge,
} from "@/components/common";
import { ROUTES } from "@/constant/routes";
import { APPLICATION_STATUS } from "@/constant/status";
import { formatThaiShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApplicationItem } from "@/types/app/applications";
import { PDFViewer } from "@/components/partials/ApplicationDetail";
import { TABLE_COLUMNS } from "./ApplicationList.config";

/** The signed PDF only exists once the application is อนุมัติแล้ว. */
const APPROVED_LICENSE_URL = "/mock/license-approved.pdf";

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
  // only a pending request can be bulk-acted on, so selection is restricted
  // to รอการอนุมัติ rows — everything else's checkbox stays disabled
  const pendingItems = items.filter(
    (item) => item.status === APPLICATION_STATUS.PENDING_APPROVAL,
  );
  const allSelected =
    pendingItems.length > 0 &&
    pendingItems.every((item) => selectedIds.includes(item.id));
  const [previewItem, setPreviewItem] = useState<ApplicationItem | null>(null);

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
                          disabled={pendingItems.length === 0}
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
                        disabled={
                          item.status !== APPLICATION_STATUS.PENDING_APPROVAL
                        }
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
                    application is still รอการอนุมัติ; there is nothing left
                    to edit or return once it has been acted on (อนุมัติ,
                    ไม่อนุมัติ, or ส่งกลับแก้ไข already happened), so those
                    icons stay muted for every other status. eye and pdf are
                    always available, so both stay navy on every status.
                    (rotate-ccw is red in the design, but follows the amber
                    ส่งคืนเพื่อแก้ไข button instead, at the user's request.)
                  */}
                      {(() => {
                        const isApproved =
                          item.status === APPLICATION_STATUS.APPROVED;
                        const canEdit =
                          item.status === APPLICATION_STATUS.PENDING_APPROVAL;

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
                                canEdit
                                  ? "text-action-approve"
                                  : "text-slate-300",
                              )}
                              aria-hidden
                            />
                            <RotateCcw
                              className={cn(
                                "size-[18px]",
                                canEdit
                                  ? "text-action-return"
                                  : "text-slate-300",
                              )}
                              aria-hidden
                            />
                            {/* the signed pdf exists only once the application
                            is อนุมัติแล้ว, so the icon is its #ff4d4f red (Ant
                            "file-pdf", Figma 4184:430930) and opens the signed
                            file only then — otherwise there is nothing to
                            view, so it greys out and stays inert */}
                            <button
                              type="button"
                              disabled={!isApproved}
                              onClick={() => setPreviewItem(item)}
                              aria-label={"ดูไฟล์ใบอนุญาต " + item.requestNo}
                              className="disabled:cursor-not-allowed"
                            >
                              <PdfIcon
                                className={cn(
                                  "size-[18px]",
                                  isApproved
                                    ? "text-[#ff4d4f]"
                                    : "text-slate-300",
                                )}
                              />
                            </button>
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

      {previewItem && (
        <PDFViewer
          open
          fileName={previewItem.typeName + ".pdf"}
          fileUrl={APPROVED_LICENSE_URL}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
