export interface PasswordRule {
  label: string;
  test: (pwd: string) => boolean;
}

/**
 * Not in Figma — a common government-system policy, shown live under the new
 * password field. Client-side only: the backend must enforce the same rules.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  { label: "ความยาวอย่างน้อย 8 ตัวอักษร", test: (pwd) => pwd.length >= 8 },
  { label: "มีตัวพิมพ์ใหญ่ (A-Z)", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "มีตัวพิมพ์เล็ก (a-z)", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "มีตัวเลข (0-9)", test: (pwd) => /\d/.test(pwd) },
  { label: "มีอักขระพิเศษ (!@#$%^&*)", test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
];
