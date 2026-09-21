import {
  PERMISSION_ACTION,
  PERMISSION_MODULE,
  type PermissionAction,
  type PermissionModule,
} from "@/types/app/roles";

/**
 * Column order of the permission matrix. Every module shows all six columns;
 * the ones it doesn't offer render as a dash (see PERMISSION_MATRIX).
 */
export const ACTION_COLUMNS: PermissionAction[] = [
  PERMISSION_ACTION.VIEW,
  PERMISSION_ACTION.CREATE,
  PERMISSION_ACTION.UPDATE,
  PERMISSION_ACTION.DELETE,
  PERMISSION_ACTION.APPROVE,
  PERMISSION_ACTION.SIGN,
];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  [PERMISSION_ACTION.VIEW]: "ดู",
  [PERMISSION_ACTION.CREATE]: "เพิ่ม",
  [PERMISSION_ACTION.UPDATE]: "แก้ไข",
  [PERMISSION_ACTION.DELETE]: "ลบ",
  [PERMISSION_ACTION.APPROVE]: "อนุมัติ",
  [PERMISSION_ACTION.SIGN]: "ลงนาม",
};

/** one row of the matrix — named after the menu the module backs */
export const MODULE_LABELS: Record<
  PermissionModule,
  { label: string; description: string }
> = {
  [PERMISSION_MODULE.APPLICATIONS]: {
    label: "คำขอ",
    description: "คำขอทั้งหมด และรอการอนุมัติ",
  },
  [PERMISSION_MODULE.REPORTS]: {
    label: "รายงานภาพรวม",
    description: "สรุปสถิติคำขอ",
  },
  [PERMISSION_MODULE.SIGNERS]: {
    label: "ผู้มีอำนาจลงนาม",
    description: "ตั้งค่าระบบ › ทะเบียนผู้มีอำนาจลงนาม",
  },
  [PERMISSION_MODULE.SIGNING_WORKFLOWS]: {
    label: "กระบวนการลงนาม",
    description: "ตั้งค่าระบบ › ลำดับผู้ลงนามของแต่ละคำขอ",
  },
  [PERMISSION_MODULE.ROLES]: {
    label: "บทบาทและสิทธิ์",
    description: "ตั้งค่าระบบ › หน้านี้",
  },
  [PERMISSION_MODULE.USERS]: {
    label: "ผู้ใช้งาน",
    description: "ตั้งค่าระบบ › กำหนดบทบาทให้ผู้ใช้",
  },
};
