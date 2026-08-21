"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** default 10 first, per the app's standard page size */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  /** when provided, renders the "แสดงหน้าละ N รายการ" size selector */
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: readonly number[];
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
  onLimitChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span>แสดงหน้าละ</span>
            <Select
              value={String(limit)}
              onValueChange={(next) =>
                onLimitChange(Number(next ?? limit) || limit)
              }
            >
              <SelectTrigger
                size="sm"
                aria-label="จำนวนรายการต่อหน้า"
                className="w-[74px]"
              >
                <SelectValue>{formatNumber(limit)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {formatNumber(size)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>รายการ</span>
          </div>
        )}

        <p>
          แสดง {formatNumber(from)}–{formatNumber(to)} จาก {formatNumber(total)}{" "}
          รายการ
        </p>
      </div>

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
