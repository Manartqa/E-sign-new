export interface PasswordRule {
  label: string;
  /** `username` = the signed-in account's sign-in name ("" while unknown) */
  test: (pwd: string, ctx: { username: string }) => boolean;
}

/**
 * The commonest passwords — legacy SSPF refused a common-password list. The
 * backend holds the full list and must enforce every rule here again.
 */
const COMMON_PASSWORDS = new Set([
  "password", "password1", "p@ssw0rd", "p@ssword", "passw0rd", "123456",
  "12345678", "123456789", "1234567890", "qwerty", "qwerty123", "abc123",
  "admin", "admin123", "administrator", "welcome", "welcome1", "letmein",
  "iloveyou", "11111111", "00000000", "1q2w3e4r", "q1w2e3r4", "aa123456",
]);

/** the part of the sign-in name worth searching for: before "@", 3+ chars */
const usernameStem = (username: string) => {
  const stem = username.split("@")[0].trim().toLowerCase();
  return stem.length >= 3 ? stem : "";
};

/**
 * Shown live under the new password field. The first five are this app's
 * government-system policy (not in Figma); the rest are legacy SSPF's server
 * rules (BC PasswordPolicy). Client-side only: the backend must enforce them.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    label: "ความยาว 8–128 ตัวอักษร",
    test: (pwd) => pwd.length >= 8 && pwd.length <= 128,
  },
  { label: "มีตัวพิมพ์ใหญ่ (A-Z)", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "มีตัวพิมพ์เล็ก (a-z)", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "มีตัวเลข (0-9)", test: (pwd) => /\d/.test(pwd) },
  { label: "มีอักขระพิเศษ (!@#$%^&*)", test: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
  {
    label: "ไม่ใช่ตัวอักษรเดียวกันทั้งหมด",
    test: (pwd) => pwd !== "" && !/^(.)\1*$/.test(pwd),
  },
  {
    label: "ไม่ใช่รหัสผ่านที่ใช้กันทั่วไป",
    test: (pwd) => pwd !== "" && !COMMON_PASSWORDS.has(pwd.toLowerCase()),
  },
  {
    label: "ไม่มีชื่อผู้ใช้งานอยู่ในรหัสผ่าน",
    test: (pwd, { username }) => {
      const stem = usernameStem(username);
      return pwd !== "" && (!stem || !pwd.toLowerCase().includes(stem));
    },
  },
];
