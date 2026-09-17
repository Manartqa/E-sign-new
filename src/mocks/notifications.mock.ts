import { MOCK_APPLICATIONS } from "@/mocks/applications.mock";
import {
  NOTIFICATION_TYPE,
  type NotificationItem,
} from "@/types/app/notifications";

const HOUR = 3_600_000;
// anchored to the real clock so "5 นาทีที่แล้ว" stays true; only ever built
// inside a React Query queryFn, so there is no SSR hydration mismatch
const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const app = (i: number) => MOCK_APPLICATIONS[i];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "NT-001",
    type: NOTIFICATION_TYPE.NEW_REQUEST,
    title: "คำขอใหม่รอการอนุมัติ",
    message: `${app(0).typeName} เลขที่ ${app(0).requestNo} จาก ${app(0).operatorName}`,
    applicationId: app(0).id,
    createdAt: ago(5 * 60_000),
    read: false,
  },
  {
    id: "NT-002",
    type: NOTIFICATION_TYPE.RESUBMITTED,
    title: "ผู้ยื่นแก้ไขและส่งคำขอกลับมาแล้ว",
    message: `${app(3).typeName} เลขที่ ${app(3).requestNo} พร้อมให้ตรวจสอบอีกครั้ง`,
    applicationId: app(3).id,
    createdAt: ago(42 * 60_000),
    read: false,
  },
  {
    id: "NT-003",
    type: NOTIFICATION_TYPE.NEW_REQUEST,
    title: "คำขอใหม่รอการอนุมัติ",
    message: `${app(4).typeName} เลขที่ ${app(4).requestNo} จาก ${app(4).operatorName}`,
    applicationId: app(4).id,
    createdAt: ago(3 * HOUR),
    read: false,
  },
  {
    id: "NT-004",
    type: NOTIFICATION_TYPE.CERTIFICATE_EXPIRING,
    title: "ใบรับรองลายมือชื่อดิจิทัลใกล้หมดอายุ",
    message: "ใบรับรองของคุณจะหมดอายุในอีก 14 วัน กรุณาติดต่อผู้ดูแลระบบเพื่อต่ออายุ",
    createdAt: ago(20 * HOUR),
    read: false,
  },
  {
    id: "NT-005",
    type: NOTIFICATION_TYPE.SIGNED,
    title: "ลงนามสำเร็จ",
    message: `ส่งเอกสารใบอนุญาต ${app(1).requestNo} เข้าระบบสารบรรณเรียบร้อยแล้ว`,
    applicationId: app(1).id,
    createdAt: ago(26 * HOUR),
    read: true,
    // read today, so it stays in the panel until tomorrow
    readAt: ago(10 * 60_000),
  },
  {
    id: "NT-006",
    type: NOTIFICATION_TYPE.RESUBMITTED,
    title: "ผู้ยื่นแก้ไขและส่งคำขอกลับมาแล้ว",
    message: `${app(7).typeName} เลขที่ ${app(7).requestNo} พร้อมให้ตรวจสอบอีกครั้ง`,
    applicationId: app(7).id,
    createdAt: ago(2 * 24 * HOUR),
    read: true,
    // read on an earlier day, so the panel hides it
    readAt: ago(2 * 24 * HOUR - HOUR),
  },
  {
    id: "NT-007",
    type: NOTIFICATION_TYPE.SIGNED,
    title: "ลงนามสำเร็จ",
    message: `ส่งเอกสารใบอนุญาต ${app(5).requestNo} เข้าระบบสารบรรณเรียบร้อยแล้ว`,
    applicationId: app(5).id,
    createdAt: ago(3 * 24 * HOUR),
    read: true,
    readAt: ago(3 * 24 * HOUR - HOUR),
  },
  {
    id: "NT-008",
    type: NOTIFICATION_TYPE.NEW_REQUEST,
    title: "คำขอใหม่รอการอนุมัติ",
    message: `${app(8).typeName} เลขที่ ${app(8).requestNo} จาก ${app(8).operatorName}`,
    applicationId: app(8).id,
    createdAt: ago(5 * 24 * HOUR),
    read: true,
    readAt: ago(5 * 24 * HOUR - HOUR),
  },
];
