import type { SelectOption } from "@/components/common";
import { APPROVAL_LEVEL_FINAL } from "@/types/app/signers";
import {
  REPLACEMENT_USAGE,
  REQUEST_USAGE,
  type SigningWorkflowStep,
} from "@/types/app/signingWorkflows";

/** legacy NOTE1 */
export const NOTE_MAX = 512;

/**
 * What is wrong with a chain, or undefined when it can be saved. The last
 * signer is the ผู้ตรวจสอบและลงนาม who issues the licence, so a chain needs
 * exactly one, at the end (user's call, 2026-11-26 — legacy checked nothing).
 */
export function chainError(
  steps: Pick<SigningWorkflowStep, "approvalLevel">[],
): string | undefined {
  if (steps.length === 0) return "กรุณาเลือกผู้ลงนามอย่างน้อย 1 คน";
  if (steps.some((step) => !step.approvalLevel))
    return "มีผู้ลงนามที่ยังไม่กำหนดระดับการอนุมัติ";
  const finals = steps.filter((step) => step.approvalLevel === APPROVAL_LEVEL_FINAL);
  if (finals.length !== 1 || steps.at(-1)?.approvalLevel !== APPROVAL_LEVEL_FINAL)
    return "ต้องมีผู้ตรวจสอบและลงนาม 1 คน และต้องอยู่ลำดับสุดท้าย";
}

/**
 * "all" is this app's value, not a master entry — the lists themselves come
 * from the backend (useWeaponCategories / useApplicationTypes).
 */
export const ALL_WEAPON_CATEGORIES: SelectOption = {
  value: "all",
  label: "ทุกประเภทยุทธภัณฑ์",
};

export const ALL_LICENSE_TYPES: SelectOption = {
  value: "all",
  label: "ทุกประเภทใบอนุญาต",
};

export const REQUEST_USAGE_OPTIONS: SelectOption[] = [
  { value: REQUEST_USAGE.NEW_AND_RENEW, label: "ใช้กับคำขอใหม่และต่ออายุ" },
  { value: REQUEST_USAGE.NEW, label: "ใช้กับคำขอใหม่เท่านั้น" },
  { value: REQUEST_USAGE.RENEW, label: "ใช้กับคำขอต่ออายุเท่านั้น" },
];

export const REPLACEMENT_USAGE_OPTIONS: SelectOption[] = [
  {
    value: REPLACEMENT_USAGE.NORMAL_AND_REPLACEMENT,
    label: "ใช้กับคำขอปกติและใบแทน",
  },
  { value: REPLACEMENT_USAGE.NORMAL, label: "ใช้กับคำขอปกติเท่านั้น" },
  { value: REPLACEMENT_USAGE.REPLACEMENT, label: "ใช้กับคำขอใบแทนเท่านั้น" },
];

export const optionLabel = (options: SelectOption[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;
