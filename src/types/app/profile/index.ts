export interface UserProfile {
  id: string;
  /** ยศ/ตำแหน่ง — the prefix select (นาย / นาง / ส.อ. …) */
  prefix: string;
  firstName: string;
  lastName: string;
  /** full display name, prefix + first + last */
  name: string;
  /** ตำแหน่ง */
  position: string;
  department: string;
  email: string;
  phone: string;
  /** ชื่อผู้ใช้งาน */
  username: string;
  /** วันที่สร้างบัญชี (ISO) */
  createdAt: string;
  /** เข้าสู่ระบบครั้งล่าสุด (ISO) */
  lastLoginAt: string;
  avatarUrl?: string;
}
