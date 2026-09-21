import type { SortParams } from "@/types/app/common";

/**
 * Orders two cell values: numbers by value, everything else as Thai text with
 * numeric runs compared as numbers ("9/2569" < "40/2569"). ISO dates sort
 * correctly as text.
 */
function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "th", {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * A sorted copy of `rows`, or `rows` itself when there is no sort. Empty
 * values stay last in both directions.
 */
export function sortRows<T>(
  rows: T[],
  { sortBy, sortOrder }: SortParams,
  valueOf: (row: T, key: string) => unknown,
): T[] {
  if (!sortBy) return rows;
  const direction = sortOrder === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const x = valueOf(a, sortBy);
    const y = valueOf(b, sortBy);
    const xEmpty = x === null || x === undefined || x === "";
    const yEmpty = y === null || y === undefined || y === "";
    if (xEmpty || yEmpty) return Number(xEmpty) - Number(yEmpty);
    return direction * compareValues(x, y);
  });
}

/** a header click cycles its column: ascending → descending → unsorted */
export function nextSort(current: SortParams, key: string): SortParams {
  if (current.sortBy !== key) return { sortBy: key, sortOrder: "asc" };
  if (current.sortOrder === "asc") return { sortBy: key, sortOrder: "desc" };
  return { sortBy: undefined, sortOrder: undefined };
}
