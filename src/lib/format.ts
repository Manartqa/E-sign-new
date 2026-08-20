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

/**
 * Manart.pa@x.co.th -> Manart.xxxx@x.co.th
 * Keeps the local part up to and including the first dot, matching the sample
 * in the profile design (Figma 116:1882).
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const dot = local.indexOf(".");
  const head = dot > 0 ? local.slice(0, dot + 1) : local.slice(0, 3);
  return `${head}xxxx@${domain}`;
}

/** 0812345678 -> 081-xxxx-xx78 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 3)}-xxxx-xx${digits.slice(-2)}`;
}

/** 0812345678 -> 081-234-5678 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** 1 มกราคม 2567 */
export function formatThaiLongDate(iso: string): string {
  return dayjs(iso).format("D MMMM BBBB");
}

/** 15 พฤษภาคม 2568, 09:30 */
export function formatThaiLongDateTime(iso: string): string {
  return dayjs(iso).format("D MMMM BBBB, HH:mm");
}
