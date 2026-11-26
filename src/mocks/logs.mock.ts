import {
  CHANGE_ACTION,
  LOGON_EVENT,
  type ChangeLog,
  type LogonLog,
} from "@/types/app/logs";
import { MOCK_APPLICATIONS } from "./applications.mock";
import { MOCK_SIGNING_WORKFLOWS } from "./signingWorkflows.mock";
import { MOCK_USERS } from "./users.mock";

/**
 * Invented history for the two log screens, newest first, spread over the
 * last 30 days from when the module loads. Deterministic otherwise.
 */
const NOW = Date.now();
const HOUR = 3_600_000;
const at = (i: number) => new Date(NOW - (i * 9 + (i % 4)) * HOUR).toISOString();

const PEOPLE = MOCK_USERS.slice(0, 8);
const LOGON_CYCLE = [
  LOGON_EVENT.LOGIN,
  LOGON_EVENT.LOGOUT,
  LOGON_EVENT.LOGIN,
  LOGON_EVENT.SESSION_TIMEOUT,
  LOGON_EVENT.LOGIN_FAILED,
  LOGON_EVENT.LOGIN,
  LOGON_EVENT.OTP_FAILED,
] as const;

export const MOCK_LOGON_LOGS: LogonLog[] = Array.from({ length: 80 }, (_, i) => {
  const person = PEOPLE[i % PEOPLE.length];
  const event = LOGON_CYCLE[i % LOGON_CYCLE.length];
  // every tenth failure is a sign-in name that matches no account
  const unknown = event === LOGON_EVENT.LOGIN_FAILED && i % 10 === 4;
  return {
    id: `LG-${String(i + 1).padStart(4, "0")}`,
    at: at(i),
    username: unknown ? "admin" : person.email,
    name: unknown ? null : person.name,
    event,
    method: i % 3 === 0 ? "SSO" : "PASSWORD",
    ip: `10.212.${130 + (i % 6)}.${20 + ((i * 7) % 200)}`,
  };
});

const CHANGE_TEMPLATES: ((i: number) => Omit<ChangeLog, "id" | "at" | "actor">)[] = [
  (i) => {
    const user = MOCK_USERS[(i + 3) % MOCK_USERS.length];
    return {
      module: "ผู้ใช้งาน",
      action: CHANGE_ACTION.UPDATE,
      target: user.name,
      detail: "แก้ไขระดับการอนุมัติ และวิธีลงลายเซ็นต์",
    };
  },
  (i) => {
    const workflow = MOCK_SIGNING_WORKFLOWS[i % MOCK_SIGNING_WORKFLOWS.length];
    return {
      module: "กระบวนการลงนาม",
      action: CHANGE_ACTION.UPDATE,
      target: workflow.name,
      detail: "จัดลำดับผู้ลงนามใหม่",
    };
  },
  (i) => {
    const item = MOCK_APPLICATIONS[i % MOCK_APPLICATIONS.length];
    return {
      module: "คำขอ",
      action: CHANGE_ACTION.APPROVE,
      target: `คำขอ ${item.requestNo}`,
      detail: "อนุมัติและลงนาม",
    };
  },
  (i) => {
    const item = MOCK_APPLICATIONS[(i + 5) % MOCK_APPLICATIONS.length];
    return {
      module: "คำขอ",
      action: CHANGE_ACTION.RETURN,
      target: `คำขอ ${item.requestNo}`,
      detail: "ส่งคืนเพื่อแก้ไข: เอกสารแนบไม่ชัดเจน / ไม่ครบถ้วน",
    };
  },
  () => ({
    module: "บทบาทและสิทธิ์",
    action: CHANGE_ACTION.UPDATE,
    target: "ผู้ตรวจสอบคำขอ",
    detail: "เพิ่มสิทธิ์ รายงานภาพรวม: ดู",
  }),
  (i) => ({
    module: "ผู้ใช้งาน",
    action: i % 2 ? CHANGE_ACTION.CREATE : CHANGE_ACTION.DELETE,
    target: `นายทดสอบ ระบบ ${i}`,
    detail: i % 2 ? "เพิ่มผู้ใช้งาน บทบาท ผู้ดูรายงาน" : "ลบผู้ใช้งาน",
  }),
  (i) => {
    const item = MOCK_APPLICATIONS[(i + 2) % MOCK_APPLICATIONS.length];
    return {
      module: "คำขอ",
      action: CHANGE_ACTION.REJECT,
      target: `คำขอ ${item.requestNo}`,
      detail: "ไม่อนุมัติ: คุณสมบัติผู้ยื่นไม่เป็นไปตามหลักเกณฑ์",
    };
  },
];

export const MOCK_CHANGE_LOGS: ChangeLog[] = Array.from({ length: 80 }, (_, i) => ({
  id: `CH-${String(i + 1).padStart(4, "0")}`,
  at: at(i),
  actor: PEOPLE[(i * 3) % PEOPLE.length].name,
  ...CHANGE_TEMPLATES[i % CHANGE_TEMPLATES.length](i),
}));
