"use client";

import {
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ThHTMLAttributes,
} from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortParams } from "@/types/app/common";

/** narrowest a dragged column may get */
const MIN_COLUMN_WIDTH = 48;

/**
 * Sortable, resizable table headers — shared by every data table.
 *
 * Columns open at the table's own default widths (the Figma min-widths).
 * Dragging a header's right edge freezes every column at its current width
 * (table-layout: fixed) and moves that one — narrower than the default too;
 * cells then wrap inside their column. Double-clicking an edge goes back to
 * the defaults. Widths are not remembered across visits.
 *
 * `sort` / `onSort` are the caller's: a paged list sends them to the backend,
 * a table holding all its rows sorts them itself with `sortRows`.
 */
export function useDataTable(
  sort: SortParams,
  onSort: (key: string) => void,
) {
  const [widths, setWidths] = useState<number[] | null>(null);

  const startResize = (index: number, event: ReactPointerEvent) => {
    // the handle sits in the header row, so it measures its own siblings
    const header = (event.currentTarget as HTMLElement).closest("tr");
    if (!header) return;
    event.preventDefault();
    event.stopPropagation();

    const base =
      widths ?? [...header.cells].map((cell) => cell.getBoundingClientRect().width);
    const startX = event.clientX;
    setWidths(base);

    const onMove = (move: PointerEvent) => {
      const next = [...base];
      next[index] = Math.max(
        MIN_COLUMN_WIDTH,
        base[index] + move.clientX - startX,
      );
      setWidths(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const reset = () => setWidths(null);

  return {
    /** add to the <table>: fixed layout once a column has been dragged */
    tableClassName: widths
      ? "table-fixed [&_th]:min-w-0 [&_td]:min-w-0 [&_td]:overflow-hidden [&_td]:break-words [&_td]:whitespace-normal"
      : undefined,
    tableStyle: widths
      ? ({
          width: widths.reduce((sum, width) => sum + width, 0),
          // never narrower than its frame — the slack spreads over the columns
          minWidth: "100%",
        } as CSSProperties)
      : undefined,
    /** props for the header at `index`; pass `sortKey` to make it sortable */
    th: (index: number, sortKey?: string): DataThProps => ({
      sortKey,
      sort,
      onSort,
      style: widths ? { width: widths[index] } : undefined,
      onResizeStart: (event) => startResize(index, event),
      onResizeReset: reset,
    }),
  };
}

interface DataThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** makes the header a sort toggle for this key */
  sortKey?: string;
  sort?: SortParams;
  onSort?: (key: string) => void;
  onResizeStart?: (event: ReactPointerEvent) => void;
  onResizeReset?: () => void;
}

export function DataTh({
  sortKey,
  sort,
  onSort,
  onResizeStart,
  onResizeReset,
  className,
  children,
  ...props
}: DataThProps) {
  const active = sortKey !== undefined && sort?.sortBy === sortKey;
  const descending = active && sort?.sortOrder === "desc";
  const Icon = !active ? ChevronsUpDown : descending ? ArrowDown : ArrowUp;

  return (
    <th
      scope="col"
      aria-sort={active ? (descending ? "descending" : "ascending") : undefined}
      // `relative` anchors the resize handle; a sticky header overrides it
      className={cn("relative", className)}
      {...props}
    >
      {sortKey && onSort ? (
        <button
          type="button"
          onClick={() => onSort(sortKey)}
          // the arrow sits at the column's right edge, the label keeps the left
          className="flex w-full items-center justify-between gap-2 text-left hover:opacity-80"
        >
          {children}
          <Icon
            className={cn("size-3.5 shrink-0", !active && "opacity-40")}
            aria-hidden
          />
        </button>
      ) : (
        children
      )}
      {onResizeStart && (
        <span
          role="separator"
          aria-orientation="vertical"
          title="ลากเพื่อปรับความกว้าง · ดับเบิลคลิกเพื่อคืนขนาดเดิม"
          onPointerDown={onResizeStart}
          onDoubleClick={onResizeReset}
          className="absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none select-none after:absolute after:inset-y-2 after:right-0 after:w-0.5 after:rounded-full hover:after:bg-brand-navy-mid/40"
        />
      )}
    </th>
  );
}
