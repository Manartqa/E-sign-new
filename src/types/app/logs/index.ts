import type { SortParams } from "@/types/app/common";

/**
 * ตั้งค่าระบบ › ประวัติการเข้าใช้งานระบบ / ประวัติการเปลี่ยนแปลงข้อมูล — the
 * legacy AuditLogon (SC05) and AuditLog (SC04) screens, each behind its own
 * permission (LOGON_LOGS:VIEW, CHANGE_LOGS:VIEW). Not in Figma.
 */

export const LOGON_EVENT = {
  LOGIN: "LOGIN",
  LOGIN_FAILED: "LOGIN_FAILED",
  OTP_FAILED: "OTP_FAILED",
  LOGOUT: "LOGOUT",
  SESSION_TIMEOUT: "SESSION_TIMEOUT",
} as const;
export type LogonEvent = (typeof LOGON_EVENT)[keyof typeof LOGON_EVENT];

export interface LogonLog {
  id: string;
  /** ISO */
  at: string;
  /** the sign-in name typed, or the SSO account */
  username: string;
  /** display name; null when the sign-in name matched no account */
  name: string | null;
  event: LogonEvent;
  method: "PASSWORD" | "SSO";
  ip: string;
}

export const CHANGE_ACTION = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  RETURN: "RETURN",
} as const;
export type ChangeAction = (typeof CHANGE_ACTION)[keyof typeof CHANGE_ACTION];

export interface ChangeLog {
  id: string;
  /** ISO */
  at: string;
  /** who made the change */
  actor: string;
  /** the screen / record kind, e.g. "ผู้ใช้งาน", "กระบวนการลงนาม", "คำขอ" */
  module: string;
  action: ChangeAction;
  /** the record changed, e.g. a user's name or a request number */
  target: string;
  /** what changed, in words */
  detail: string;
}

export interface LogListParams extends SortParams {
  /** inclusive ISO bounds, both optional — unlike legacy, actually applied */
  dateFrom?: string;
  dateTo?: string;
  /** matches the user / actor, the target and the detail */
  keyword?: string;
  /** a LogonEvent or ChangeAction, or "all" */
  kind?: string;
  page?: number;
  limit?: number;
}

export interface LogListResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
