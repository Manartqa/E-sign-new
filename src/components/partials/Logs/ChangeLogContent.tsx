"use client";

import { getChangeLogs } from "@/services/log.service";
import { LogListContent } from "./LogListContent";
import { CHANGE_ACTION_LABELS, CHANGE_COLUMNS, kindOptions } from "./Logs.config";

const ACTION_OPTIONS = kindOptions(CHANGE_ACTION_LABELS);

/** ตั้งค่าระบบ › ประวัติการเปลี่ยนแปลงข้อมูล (legacy AuditLog, SC04) */
export default function ChangeLogContent() {
  return (
    <LogListContent
      title="ประวัติการเปลี่ยนแปลงข้อมูล"
      description="การเพิ่ม แก้ไข ลบข้อมูลในการตั้งค่า และการพิจารณาคำขอ"
      queryKey="changeLogs"
      fetchLogs={getChangeLogs}
      columns={CHANGE_COLUMNS}
      kindLabel="การดำเนินการ"
      kindOptions={ACTION_OPTIONS}
      fileName="change-log"
    />
  );
}
