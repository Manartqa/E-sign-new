"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Flag, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTh,
  EmptyState,
  ErrorState,
  Pagination,
  PdfIcon,
  SignIcon,
  StatusBadge,
  useDataTable,
} from "@/components/common";
import { ROUTES } from "@/constant/routes";
import { APPLICATION_STATUS } from "@/constant/status";
import { useApplicationActions } from "@/hooks/applications";
import { usePermission, useProfile } from "@/hooks/profile";
import { formatThaiShortDate } from "@/lib/format";
import { signMethodFor } from "@/lib/sign-method";
import { cn } from "@/lib/utils";
import { TokenSignError } from "@/services/application.service";
import type { ApplicationItem, ReturnFormValues } from "@/types/app/applications";
import type { SortParams } from "@/types/app/common";
import {
  PDFViewer,
  ReturnForEditModal,
  SignatureModal,
} from "@/components/partials/ApplicationDetail";
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
  /** sorts the whole list server-side, not just this page */
  sort: SortParams;
  onSort: (key: string) => void;
}

/** the checkbox and the row actions hold no data to order by */
const UNSORTABLE = new Set(["select", "actions"]);

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

/** placeholder bar width per column, so the skeleton reads like real data */
const SKELETON_BAR: Partial<Record<string, string>> = {
  select: "size-4 rounded-[3px]",
  status: "h-6 w-24 rounded-full",
  actions: "ml-auto h-[18px] w-28",
};

/**
 * Not in Figma: the loading state keeps the real header and column widths, so
 * nothing shifts when the rows land.
 */
function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border" aria-busy="true">
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
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i} className="border-b">
              {TABLE_COLUMNS.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    CELL,
                    "h-[53px]",
                    column.key === "assignedOfficer" && NO_RIGHT,
                    column.key === "actions" &&
                      cn(STICKY_ACTIONS, "z-10 bg-white"),
                  )}
                >
                  <Skeleton
                    className={SKELETON_BAR[column.key] ?? "h-4 w-3/4"}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
  sort,
  onSort,
}: ApplicationTableProps) {
  const table = useDataTable(sort, onSort);
  // only a request at this officer's own turn can be acted on, so selection
  // is restricted to `canAct` rows — everything else's checkbox stays disabled
  const { can } = usePermission();
  const canDecide = can("APPLICATIONS:APPROVE");
  const canSign = can("APPLICATIONS:SIGN");
  // nothing to do with a selection without either permission
  const actionableItems =
    canDecide || canSign ? items.filter((item) => item.canAct) : [];
  const allSelected =
    actionableItems.length > 0 &&
    actionableItems.every((item) => selectedIds.includes(item.id));
  const [previewItem, setPreviewItem] = useState<ApplicationItem | null>(null);
  const [returnTarget, setReturnTarget] = useState<ApplicationItem | null>(
    null,
  );
  const [signTarget, setSignTarget] = useState<ApplicationItem | null>(null);
  const { profile } = useProfile();
  const { decide } = useApplicationActions(returnTarget?.id ?? "");
  const { approve } = useApplicationActions(signTarget?.id ?? "");

  const handleReturn = async (values: ReturnFormValues) => {
    try {
      await decide.mutateAsync({
        action: "RETURN",
        reasonCode: values.reasonCode,
        notes: values.notes,
      });
      setReturnTarget(null);
      toast.success("ส่งคืนคำขอเพื่อแก้ไขแล้ว");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleSign = async (input: { pin?: string; notes: string }) => {
    if (!signTarget) return;
    const method = signMethodFor(signTarget.isFinalSigner, profile?.signingMethod);
    if (!method) return;
    try {
      await approve.mutateAsync({
        method,
        pin: input.pin,
        notes: input.notes,
        officerId: profile?.id ?? "",
      });
      setSignTarget(null);
      toast.success("อนุมัติและลงนามแล้ว");
    } catch (error) {
      // a token failure is shown beside the PIN; anything else is a toast
      if (!(error instanceof TokenSignError)) toast.error((error as Error).message);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      {isError ? (
        <ErrorState />
      ) : isLoading ? (
        <TableSkeleton rows={limit} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border">
            <table
              className={cn("w-full border-collapse text-left", table.tableClassName)}
              style={table.tableStyle}
            >
              <thead className="border-b bg-[#f8fafc]">
                <tr>
                  {TABLE_COLUMNS.map((column, index) => (
                    <DataTh
                      key={column.key}
                      {...table.th(index, UNSORTABLE.has(column.key) ? undefined : column.key)}
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
                          disabled={actionableItems.length === 0}
                          aria-label="เลือกทั้งหมด"
                          className="size-4 rounded-[3px]"
                        />
                      ) : (
                        column.label
                      )}
                    </DataTh>
                  ))}
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    // not in Figma: rows fade up in turn when a page of
                    // results arrives; only the first 10 are staggered so a
                    // 50-row page doesn't keep the user waiting
                    className={cn(
                      "group animate-in border-b fill-mode-both duration-200 fade-in slide-in-from-bottom-1 motion-reduce:animate-none",
                      item.isUrgent
                        ? "bg-urgent-bg hover:bg-urgent-bg-hover"
                        : "bg-white hover:bg-[#f8fafc]",
                    )}
                    style={{ animationDelay: `${Math.min(index, 9) * 30}ms` }}
                  >
                    <td
                      className={cn(
                        CELL,
                        // the bar runs down the row's left edge, outside the
                        // horizontal scroll of the columns to its right
                        item.isUrgent && "border-l-4 border-l-urgent",
                      )}
                    >
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => onToggleSelect(item.id)}
                        disabled={!actionableItems.includes(item)}
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
                      {item.isUrgent && (
                        <span
                          // หมายเหตุด่วน on hover; screen readers get it inline
                          title={item.urgentRemark ?? undefined}
                          className="ml-2 inline-flex items-center gap-1 rounded-full bg-urgent px-2 py-0.5 align-middle text-[11px] font-semibold whitespace-nowrap text-white"
                        >
                          <Flag className="size-3 fill-current" aria-hidden />
                          ด่วน
                          {item.urgentRemark && (
                            <span className="sr-only">
                              {" — "}
                              {item.urgentRemark}
                            </span>
                          )}
                        </span>
                      )}
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
                      {formatThaiShortDate(item.documentDate)}
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
                    <td className={cn(CELL, "text-sm text-muted-foreground")}>
                      {item.buyerName ?? "—"}
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
                        "z-10",
                        item.isUrgent
                          ? "bg-urgent-bg group-hover:bg-urgent-bg-hover"
                          : "bg-white group-hover:bg-[#f8fafc]",
                      )}
                    >
                      {/*
                    Figma 171:2032 colours the row actions — eye #1b3a6b,
                    edit #22c55e, rotate-ccw #ef4444 — but only while the
                    application waits for THIS officer's decision (`canAct`:
                    รอการอนุมัติ and their turn on the chain); before their
                    turn, after they approved, or once it was decided there
                    is nothing for them to do, so those icons stay muted.
                    eye and pdf are always available, so both stay navy.
                    (rotate-ccw is red in the design, but follows the amber
                    ส่งคืนเพื่อแก้ไข button instead, at the user's request.)
                  */}
                      {(() => {
                        const isApproved =
                          item.status === APPLICATION_STATUS.APPROVED;
                        const canEdit = item.canAct;

                        return (
                          <div className="flex items-center justify-end gap-4">
                            <Link
                              href={ROUTES.applicationDetail(item.id)}
                              aria-label={"ดูรายละเอียด " + item.requestNo}
                              className="text-brand-navy-mid hover:opacity-70"
                            >
                              <Eye className="size-[18px]" aria-hidden />
                            </Link>
                            {/* pen = quick อนุมัติและลงนาม (green, same
                            SignatureModal as the detail page's Check button);
                            rotate-ccw = quick ส่งคืนเพื่อแก้ไข (amber, same
                            ReturnForEditModal as the detail page's button) */}
                            {canSign && (
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => setSignTarget(item)}
                                aria-label={"อนุมัติและลงนาม " + item.requestNo}
                                className="disabled:cursor-not-allowed"
                              >
                                <SignIcon
                                  className={cn(
                                    "size-[18px]",
                                    canEdit
                                      ? "text-action-approve"
                                      : "text-slate-300",
                                  )}
                                  aria-hidden
                                />
                              </button>
                            )}
                            {canDecide && (
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => setReturnTarget(item)}
                                aria-label={
                                  "ส่งคืนเพื่อแก้ไข " + item.requestNo
                                }
                                className="disabled:cursor-not-allowed"
                              >
                                <RotateCcw
                                  className={cn(
                                    "size-[18px]",
                                    canEdit
                                      ? "text-action-return"
                                      : "text-slate-300",
                                  )}
                                  aria-hidden
                                />
                              </button>
                            )}
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

      <ReturnForEditModal
        open={!!returnTarget}
        mode="return"
        isSubmitting={decide.isPending}
        onClose={() => setReturnTarget(null)}
        onConfirm={(values) => void handleReturn(values)}
      />

      {signTarget && (
        <SignatureModal
          open
          details={[signTarget]}
          isSubmitting={approve.isPending}
          error={
            approve.error instanceof TokenSignError
              ? approve.error.message
              : undefined
          }
          onClose={() => setSignTarget(null)}
          onConfirm={(input) => void handleSign(input)}
        />
      )}
    </div>
  );
}
