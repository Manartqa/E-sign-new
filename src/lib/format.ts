import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";

dayjs.extend(buddhistEra);
dayjs.locale("th");

/** 18 ต.ค. 2567 14:22 */
export function formatThaiDateTime(iso: string): string {
  return dayjs(iso).format("D MMM BBBB HH:mm");
}

/** 18 ต.ค. 2567 */
export function formatThaiDate(iso: string): string {
  return dayjs(iso).format("D MMM BBBB");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH").format(value);
}
