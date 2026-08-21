"use client";

import { useState } from "react";
import { Pagination, PdfIcon } from "@/components/common";
import { formatThaiShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DocumentItem } from "@/types/app/applications";

interface DocumentTableProps {
  documents: DocumentItem[];
  onOpen?: (document: DocumentItem) => void;
  /** the per-person cards embed this table without a pager */
  showPagination?: boolean;
  /** name + file only, dropping the date/expiry/place columns (Figma 49:1958) */
  compact?: boolean;
}

const CELL = "border-r px-3 py-3 align-top";
const PAGE_SIZE = 10;

/**
 * Freezes the "เอกสาร" (open-file) column to the right edge on the narrow
 * viewports (iPad/mobile) where the fixed min-widths above force this table
 * to scroll horizontally — otherwise the action icon scrolls out of view.
 * Same box-shadow-as-border trick as ApplicationTable's sticky actions
 * column: border-collapse hands the grid hairlines to the table, so the
 * sticky cell's own left border has to be redrawn as an inset box-shadow
 * (which sticks) instead, and the column before it drops its border-r so
 * the seam isn't doubled.
 */
const STICKY_DOC = "sticky right-0 shadow-[inset_1px_0_0_0_var(--border)]";
const NO_RIGHT = "border-r-0!";

/** Figma: tab-panel-applicant-company › table (83:3204) */
export function DocumentTable({
  documents,
  onOpen,
  showPagination = true,
  compact = false,
}: DocumentTableProps) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * PAGE_SIZE;
  const rows = documents.slice(start, start + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b bg-[#f8fafc]">
            <tr>
              <th
                scope="col"
                className={cn(
                  CELL,
                  "w-12 text-[13px] font-bold text-brand-navy-mid",
                )}
              >
                #
              </th>
              <th
                scope="col"
                className={cn(
                  CELL,
                  "min-w-[380px] text-[13px] font-bold text-brand-navy-mid",
                  compact && NO_RIGHT,
                )}
              >
                ชื่อเอกสาร
              </th>
              {!compact && (
                <>
                  <th
                    scope="col"
                    className={cn(
                      CELL,
                      "min-w-[104px] text-[13px] font-bold whitespace-nowrap text-brand-navy-mid",
                    )}
                  >
                    วันที่เอกสาร
                  </th>
                  <th
                    scope="col"
                    className={cn(
                      CELL,
                      "min-w-[116px] text-[13px] font-bold whitespace-nowrap text-brand-navy-mid",
                    )}
                  >
                    วันหมดอายุ
                  </th>
                  <th
                    scope="col"
                    className={cn(
                      CELL,
                      "min-w-[260px] text-[13px] font-bold text-brand-navy-mid",
                      NO_RIGHT,
                    )}
                  >
                    สถานที่ออกเอกสาร
                  </th>
                </>
              )}
              <th
                scope="col"
                className={cn(
                  STICKY_DOC,
                  "z-20 bg-[#f8fafc] px-3 py-3 text-[13px] font-bold whitespace-nowrap text-brand-navy-mid",
                )}
              >
                เอกสาร
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((document, index) => {
              const isEven = (start + index) % 2 === 0;

              return (
              <tr
                key={document.id}
                className={cn("border-b", isEven ? "bg-white" : "bg-[#f9f9f9]")}
              >
                <td
                  className={cn(
                    CELL,
                    "text-center text-sm text-muted-foreground",
                  )}
                >
                  {start + index + 1}
                </td>
                <td
                  className={cn(
                    CELL,
                    "text-sm font-medium text-brand-navy-mid",
                    compact && NO_RIGHT,
                  )}
                >
                  {document.name}
                </td>
                {!compact && (
                  <>
                    <td
                      className={cn(
                        CELL,
                        "text-sm whitespace-nowrap text-muted-foreground",
                      )}
                    >
                      {formatThaiShortDate(document.documentDate)}
                    </td>
                    <td
                      className={cn(
                        CELL,
                        "text-sm whitespace-nowrap text-muted-foreground",
                      )}
                    >
                      {formatThaiShortDate(document.expiryDate)}
                    </td>
                    <td
                      className={cn(
                        CELL,
                        "text-sm text-muted-foreground",
                        NO_RIGHT,
                      )}
                    >
                      {document.issuedPlace}
                    </td>
                  </>
                )}
                <td
                  className={cn(
                    STICKY_DOC,
                    "z-10 px-3 py-3",
                    isEven ? "bg-white" : "bg-[#f9f9f9]",
                  )}
                >
                  {(() => {
                    const hasFile = Boolean(document.fileUrl);

                    return (
                      <button
                        type="button"
                        disabled={!hasFile}
                        onClick={() => hasFile && onOpen?.(document)}
                        aria-label={
                          hasFile
                            ? "เปิดเอกสาร " + document.name
                            : document.name + " (ไม่มีเอกสาร)"
                        }
                        className={cn(
                          "flex h-8 w-7 items-center justify-center transition-opacity",
                          hasFile ? "hover:opacity-70" : "cursor-not-allowed",
                        )}
                      >
                        <PdfIcon
                          className={cn(
                            "size-5",
                            hasFile ? "text-[#ff4d4f]" : "text-slate-300",
                          )}
                        />
                      </button>
                    );
                  })()}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="border-t bg-white px-4 py-2.5">
          <Pagination
            page={page}
            limit={PAGE_SIZE}
            total={documents.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
