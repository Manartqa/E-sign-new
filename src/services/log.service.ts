import { USE_MOCK } from "@/lib/env";
import { getChangeLogsApi, getLogonLogsApi } from "@/lib/api/api-main";
import { MOCK_CHANGE_LOGS, MOCK_LOGON_LOGS } from "@/mocks/logs.mock";
import type {
  ChangeLog,
  LogListParams,
  LogListResult,
  LogonLog,
} from "@/types/app/logs";

const DEFAULT_LIMIT = 20;

/**
 * Filter + page, the mock stand-in for the endpoint. `limit: 0` returns every
 * matching row — what the CSV export asks for.
 */
function pageOf<T extends { at: string }>(
  rows: T[],
  params: LogListParams,
  kindOf: (row: T) => string,
  text: (row: T) => string,
): LogListResult<T> {
  const keyword = params.keyword?.trim().toLowerCase() ?? "";
  const filtered = rows.filter(
    (row) =>
      (!params.dateFrom || row.at >= params.dateFrom) &&
      (!params.dateTo || row.at <= params.dateTo) &&
      (!params.kind || params.kind === "all" || kindOf(row) === params.kind) &&
      (!keyword || text(row).toLowerCase().includes(keyword)),
  );
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;
  return {
    items: limit === 0 ? filtered : filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    limit,
  };
}

/** ประวัติการเข้าใช้งานระบบ, newest first */
export async function getLogonLogs(
  params: LogListParams = {},
): Promise<LogListResult<LogonLog>> {
  if (USE_MOCK)
    return pageOf(
      MOCK_LOGON_LOGS,
      params,
      (row) => row.event,
      (row) => `${row.username} ${row.name ?? ""} ${row.ip}`,
    );
  const res = await getLogonLogsApi({ ...params });
  return { ...res.data, items: res.data.data };
}

/** ประวัติการเปลี่ยนแปลงข้อมูล, newest first */
export async function getChangeLogs(
  params: LogListParams = {},
): Promise<LogListResult<ChangeLog>> {
  if (USE_MOCK)
    return pageOf(
      MOCK_CHANGE_LOGS,
      params,
      (row) => row.action,
      (row) => `${row.actor} ${row.module} ${row.target} ${row.detail}`,
    );
  const res = await getChangeLogsApi({ ...params });
  return { ...res.data, items: res.data.data };
}
