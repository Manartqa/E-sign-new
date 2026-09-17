export interface PasswordRule {
  label: string;
  test: (pwd: string) => boolean;
}

/**
 * Not in Figma — a common government-system policy, shown live under the new
 * password field. Client-side only: the backend must enforce the same rules.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  { label: "อย่างน้อย 8 ตัวอักษร", test: (pwd) => pwd.length >= 8 },
  { label: "ตัวพิมพ์ใหญ่ (A-Z)", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "ตัวพิมพ์เล็ก (a-z)", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "ตัวเลข (0-9)", test: (pwd) => /\d/.test(pwd) },
  { label: "อักขระพิเศษ เช่น ! @ # $", test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
];
