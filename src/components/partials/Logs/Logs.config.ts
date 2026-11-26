import { formatThaiDateTime } from "@/lib/format";
import type { CsvColumn } from "@/lib/csv";
import {
  CHANGE_ACTION,
  LOGON_EVENT,
  type ChangeAction,
  type ChangeLog,
  type LogonEvent,
  type LogonLog,
} from "@/types/app/logs";

export const LOGON_EVENT_LABELS: Record<LogonEvent, string> = {
  [LOGON_EVENT.LOGIN]: "เข้าสู่ระบบ",
  [LOGON_EVENT.LOGIN_FAILED]: "เข้าสู่ระบบไม่สำเร็จ",
  [LOGON_EVENT.OTP_FAILED]: "รหัส OTP ไม่ถูกต้อง",
  [LOGON_EVENT.LOGOUT]: "ออกจากระบบ",
  [LOGON_EVENT.SESSION_TIMEOUT]: "หมดเวลาการใช้งาน",
};

export const CHANGE_ACTION_LABELS: Record<ChangeAction, string> = {
  [CHANGE_ACTION.CREATE]: "เพิ่ม",
  [CHANGE_ACTION.UPDATE]: "แก้ไข",
  [CHANGE_ACTION.DELETE]: "ลบ",
  [CHANGE_ACTION.APPROVE]: "อนุมัติ",
  [CHANGE_ACTION.REJECT]: "ไม่อนุมัติ",
  [CHANGE_ACTION.RETURN]: "ส่งคืนเพื่อแก้ไข",
};

/** the dropdown's choices, "all" first */
export const kindOptions = (labels: Record<string, string>) => [
  { value: "all", label: "ทั้งหมด" },
  ...Object.entries(labels).map(([value, label]) => ({ value, label })),
];

/** a log column — the same text on screen and in the CSV */
export type LogColumn<T> = CsvColumn<T> & { className?: string };

export const LOGON_COLUMNS: LogColumn<LogonLog>[] = [
  { label: "วันที่-เวลา", value: (row) => formatThaiDateTime(row.at), className: "whitespace-nowrap" },
  { label: "ชื่อผู้ใช้งาน", value: (row) => row.username },
  { label: "ชื่อ-นามสกุล", value: (row) => row.name ?? "—" },
  { label: "เหตุการณ์", value: (row) => LOGON_EVENT_LABELS[row.event], className: "whitespace-nowrap" },
  { label: "วิธีเข้าสู่ระบบ", value: (row) => (row.method === "SSO" ? "SSO" : "รหัสผ่าน") },
  { label: "IP Address", value: (row) => row.ip, className: "whitespace-nowrap" },
];

export const CHANGE_COLUMNS: LogColumn<ChangeLog>[] = [
  { label: "วันที่-เวลา", value: (row) => formatThaiDateTime(row.at), className: "whitespace-nowrap" },
  { label: "ผู้ดำเนินการ", value: (row) => row.actor, className: "whitespace-nowrap" },
  { label: "เมนู", value: (row) => row.module, className: "whitespace-nowrap" },
  { label: "การดำเนินการ", value: (row) => CHANGE_ACTION_LABELS[row.action], className: "whitespace-nowrap" },
  { label: "รายการ", value: (row) => row.target },
  { label: "รายละเอียด", value: (row) => row.detail },
];
