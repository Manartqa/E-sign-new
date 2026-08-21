"use client";

import { useState } from "react";
import { Pagination } from "@/components/common";
import { cn } from "@/lib/utils";
import type { DetailTableColumn } from "@/types/app/applications";

const PAGE_SIZE = 10;

interface DataTablePanelProps {
  heading?: string;
  columns: DetailTableColumn[];
  rows: Record<string, string>[];
}

/**
 * A paginated data table under an optional section heading — the shape the
 * อาคารและสถานที่ and รายการอาวุธ/วัตถุดิบ tabs use (Figma 49:980).
 */
export function DataTablePanel({
  heading,
  columns,
  rows,
}: DataTablePanelProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  const pageRows = rows.slice(start, start + limit);

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-card px-6 pt-1 pb-6">
      {heading && (
        <h3 className="text-base font-bold text-brand-navy-mid">{heading}</h3>
      )}

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b bg-[#f8fafc]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "border-r px-3 py-3 text-[13px] font-bold whitespace-nowrap text-brand-navy-mid",
                      column.width,
                    )}
                  >
                    {column.label}
                  </th>
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
