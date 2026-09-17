import type { SelectOption } from "@/components/common";
import { APPLICATION_TYPE_OPTIONS } from "@/mocks/applications.mock";
import {
  REPLACEMENT_USAGE,
  REQUEST_USAGE,
} from "@/types/app/signingWorkflows";

/**
 * Only "ทุกประเภทยุทธภัณฑ์" is known from the legacy screen; the other
 * categories are placeholders until the backend supplies the real list.
 */
export const WEAPON_CATEGORY_OPTIONS: SelectOption[] = [
  { value: "all", label: "ทุกประเภทยุทธภัณฑ์" },
  { value: "firearm", label: "อาวุธปืนและส่วนประกอบ" },
  { value: "ammunition", label: "กระสุนและวัตถุระเบิด" },
  { value: "vehicle", label: "ยานพาหนะและอุปกรณ์ทางทหาร" },
  { value: "other", label: "ยุทธภัณฑ์อื่น ๆ" },
];

export const LICENSE_TYPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "ทุกประเภทใบอนุญาต" },
  ...APPLICATION_TYPE_OPTIONS,
];

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
