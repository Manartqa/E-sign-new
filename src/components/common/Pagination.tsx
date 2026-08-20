"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function buildPages(current: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
  if (current >= totalPages - 3)
    return [1, "…", ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
  return [1, "…", current - 1, current, current + 1, "…", totalPages];
}

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 text-sm",
        className,
      )}
    >
      <p className="text-muted-foreground">
        แสดง {formatNumber(from)}–{formatNumber(to)} จาก {formatNumber(total)}{" "}
        รายการ
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="หน้าก่อนหน้า"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex size-9 items-center justify-center rounded-lg border disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        {buildPages(page, totalPages).map((item, index) =>
          item === "…" ? (
            <span key={`gap-${index}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "size-9 rounded-lg border text-sm font-medium",
                item === page
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-secondary",
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="หน้าถัดไป"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex size-9 items-center justify-center rounded-lg border disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
