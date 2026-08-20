import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.extend(relativeTime);
dayjs.locale("th");

/** 18 ต.ค. 2567 14:22 */
export function formatThaiDateTime(iso: string): string {
  return dayjs(iso).format("D MMM BBBB HH:mm");
}

/** 18 ต.ค. 2567 */
export function formatThaiDate(iso: string): string {
  return dayjs(iso).format("D MMM BBBB");
}

/** 11/05/2571 — the dd/MM/BE format used in the application table */
export function formatThaiShortDate(iso: string): string {
  return dayjs(iso).format("DD/MM/BBBB");
}

/** "2 ชั่วโมงที่แล้ว" — the `วันที่อัปเดต` column */
export function formatRelative(iso: string): string {
  return dayjs(iso).fromNow();
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH").format(value);
}
