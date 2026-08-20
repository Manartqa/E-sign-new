/** Envelope for a single resource. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Envelope for list endpoints.
 * Shape taken verbatim from the `developer-handoff` sample response:
 * `{ data: [...], total, page, limit }`.
 */
export interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PageParams {
  page?: number;
  limit?: number;
}
