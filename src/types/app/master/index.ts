/**
 * One entry of a backend-owned option list (master data). Same shape as the
 * select components' SelectOption, so a list drops straight into a dropdown.
 */
export interface MasterOption {
  value: string;
  label: string;
}
