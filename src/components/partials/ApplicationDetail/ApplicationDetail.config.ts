import { APPLICATION_STATUS } from "@/constant/status";
import { formatThaiDate } from "@/lib/format";
import {
  DETAIL_TABS,
  MY_STEP_STATUS,
  type ApplicationDetail,
  type ApplicationItem,
  type DetailTabKey,
  type TimelineEvent,
} from "@/types/app/applications";

/**
 * Why a request still รอการอนุมัติ shows no action buttons — or undefined
 * when there is nothing to explain (the officer can act, the request is
 * decided, or they are not on its chain).
 */
export function stepNotice(
  item: Pick<ApplicationItem, "status" | "canAct" | "myStep">,
): string | undefined {
  if (item.status !== APPLICATION_STATUS.PENDING_APPROVAL || item.canAct) return;
  const step = item.myStep;
  if (!step) return;
  if (step.status === MY_STEP_STATUS.WAITING_PREVIOUS) {
    return `รอผู้ลงนามลำดับก่อนหน้า — คุณเป็นผู้ลงนามลำดับที่ ${step.stepNo} ยังไม่ถึงลำดับการลงนามของคุณ`;
  }
  if (step.status === MY_STEP_STATUS.APPROVED) {
    const when = step.decidedAt ? ` เมื่อ ${formatThaiDate(step.decidedAt)}` : "";
    return `คุณอนุมัติคำขอนี้แล้ว${when} — รอผู้ลงนามลำดับถัดไป`;
  }
}

/** the ครั้งที่ numbers a history covers, oldest first */
export const revisionsOf = (events: Pick<TimelineEvent, "revisionNo">[]) =>
  [...new Set(events.map((event) => event.revisionNo))].sort((a, b) => a - b);

/**
 * The tabs this request has data for, in DETAIL_TABS order. A tab the backend
 * sends no panel for is left out entirely rather than shown empty — request
 * types differ in which sections they have (legacy SSPF did the same).
 */
export const visibleDetailTabs = (panels: ApplicationDetail["panels"]) =>
  DETAIL_TABS.flatMap((tab) => {
    const panel = panels[tab.key];
    return panel ? [{ key: tab.key, label: panel.tabLabel ?? tab.label }] : [];
  });

/**
 * Column widths for the data-table tabs, by tab then column key. The backend
 * only sends keys and labels; a column missing here sizes to its content.
 */
export const DETAIL_COLUMN_WIDTHS: Partial<
  Record<DetailTabKey, Record<string, string>>
> = {
  buildings: {
    no: "w-12",
    name: "min-w-[240px]",
    type: "min-w-[140px]",
    purpose: "min-w-[360px]",
    status: "min-w-[120px]",
  },
  permits: {
    no: "w-12",
    code: "min-w-[100px]",
    group: "min-w-[120px]",
    name: "min-w-[160px]",
    detail: "min-w-[220px]",
    capacityUnit: "min-w-[180px]",
    capacityWeight: "min-w-[180px]",
  },
};
