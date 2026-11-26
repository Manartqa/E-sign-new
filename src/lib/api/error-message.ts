import axios from "axios";

/**
 * The backend's own reason for a failed call (`{ message }` in the body),
 * e.g. "รายการนี้ลงนามแล้ว หรือยังไม่ถึงลำดับการลงนาม", or `fallback` when
 * it sent none — never axios' English "Request failed with status code …".
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
}
