import {
  BarChart3,
  Clock,
  FileText,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constant/routes";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** key into the counts map passed to <Sidebar/>, renders an amber pill */
  badgeKey?: "pending";
}

/**
 * Figma: 🧩 Components › Sidebar/Navigation (5 active states).
 *
 * Order deviates from the design on purpose: Figma puts รายงานภาพรวม first,
 * but it sits below รอการอนุมัติ here at the user's request, so the two
 * คำขอ entries lead — which also matches /applications being the landing
 * route after sign-in.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.applications, label: "คำขอทั้งหมด", icon: FileText },
  {
    href: ROUTES.applicationsPending,
    label: "รอการอนุมัติ",
    icon: Clock,
    badgeKey: "pending",
  },
  { href: ROUTES.reports, label: "รายงานภาพรวม", icon: BarChart3 },
  { href: ROUTES.profile, label: "โปรไฟล์ผู้ใช้งาน", icon: User },
  { href: ROUTES.settings, label: "ตั้งค่าระบบ", icon: Settings },
];

export const APP_NAME = "ระบบการลงนามอนุมัติดิจิทัล";
export const APP_SUBTITLE = "E-Signature";

/** Breadcrumb trail per route, rendered in the TopBar. */
export const BREADCRUMBS: Record<string, string[]> = {
  [ROUTES.reports]: ["หน้าหลัก", "รายงานภาพรวม"],
  [ROUTES.applications]: ["หน้าหลัก", "คำขอทั้งหมด"],
  [ROUTES.applicationsPending]: ["หน้าหลัก", "รอการอนุมัติ"],
  [ROUTES.profile]: ["หน้าหลัก", "โปรไฟล์ผู้ใช้งาน"],
  [ROUTES.settings]: ["หน้าหลัก", "ตั้งค่าระบบ"],
};

export function getInitials(name: string): string {
  return name.trim().slice(0, 2);
}
