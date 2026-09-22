"use client";

import { useState } from "react";
import { DataTh, Pagination, useDataTable } from "@/components/common";
import { cn } from "@/lib/utils";
import { nextSort, sortRows } from "@/lib/sort";
import type { SortParams } from "@/types/app/common";
import type { DetailTableColumn } from "@/types/app/applications";

const PAGE_SIZE = 10;

interface DataTablePanelProps {
  heading?: string;
  columns: DetailTableColumn[];
  rows: Record<string, string>[];
  /** column key → width class; the frontend owns these, not the backend */
  widths?: Record<string, string>;
}

/**
 * A paginated data table under an optional section heading — the shape the
 * อาคารและสถานที่ and รายการอาวุธ/วัตถุดิบ tabs use (Figma 49:980).
 */
export function DataTablePanel({
  heading,
  columns,
  rows,
  widths,
}: DataTablePanelProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [sort, setSort] = useState<SortParams>({});
  const table = useDataTable(sort, (key) => {
    setSort(nextSort(sort, key));
    setPage(1);
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  // every row is here, so the whole list is sorted, not just this page
  const sorted = sortRows(rows, sort, (row, key) => row[key]);
  const pageRows = sorted.slice(start, start + limit);

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-card px-6 pt-1 pb-6">
      {heading && (
        <h3 className="text-base font-bold text-brand-navy-mid">{heading}</h3>
      )}

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table
            className={cn("w-full border-collapse text-left", table.tableClassName)}
            style={table.tableStyle}
          >
            <thead className="border-b bg-[#f8fafc]">
              <tr>
                {columns.map((column, index) => (
                  <DataTh
                    key={column.key}
                    {...table.th(index, column.key)}
                    className={cn(
                      "border-r px-3 py-3 text-[13px] font-bold whitespace-nowrap text-brand-navy-mid",
                      widths?.[column.key],
                    )}
                  >
                    {column.label}
                  </DataTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr
                  key={start + index}
                  className={cn(
                    "border-b",
                    (start + index) % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]",
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "border-r px-3 py-3 align-top text-sm",
                        column.strong
                          ? "font-medium text-brand-navy-mid"
                          : "text-muted-foreground",
                      )}
                    >
                      {row[column.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t bg-white px-4 py-2.5">
          <Pagination
            page={currentPage}
            limit={limit}
            total={rows.length}
            onPageChange={setPage}
            onLimitChange={(next) => {
              setLimit(next);
              setPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
