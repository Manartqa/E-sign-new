"use client";

import { getLogonLogs } from "@/services/log.service";
import { LogListContent } from "./LogListContent";
import { LOGON_COLUMNS, LOGON_EVENT_LABELS, kindOptions } from "./Logs.config";

const EVENT_OPTIONS = kindOptions(LOGON_EVENT_LABELS);

/** ตั้งค่าระบบ › ประวัติการเข้าใช้งานระบบ (legacy AuditLogon, SC05) */
export default function LogonLogContent() {
  return (
    <LogListContent
      title="ประวัติการเข้าใช้งานระบบ"
      description="การเข้าสู่ระบบ ออกจากระบบ และการเข้าสู่ระบบที่ไม่สำเร็จ"
      queryKey="logonLogs"
      fetchLogs={getLogonLogs}
      columns={LOGON_COLUMNS}
      kindLabel="เหตุการณ์"
      kindOptions={EVENT_OPTIONS}
      fileName="logon-log"
    />
  );
}
