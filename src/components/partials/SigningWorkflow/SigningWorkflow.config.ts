import type { SelectOption } from "@/components/common";
import {
  REPLACEMENT_USAGE,
  REQUEST_USAGE,
} from "@/types/app/signingWorkflows";

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
