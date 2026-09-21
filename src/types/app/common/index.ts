export type SortOrder = "asc" | "desc";

/**
 * Column sort for a list request. Paged lists send it to the backend so the
 * whole result is ordered, not just the page on screen; no `sortBy` = the
 * list's default order.
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: SortOrder;
}
