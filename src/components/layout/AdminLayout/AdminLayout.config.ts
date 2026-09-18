import {
  BarChart3,
  Clock,
  FileCheck,
  FilePen,
  FileText,
  ListOrdered,
  Settings,
  ShieldAlert,
  ShieldUser,
  User,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constant/routes";
import {
  NOTIFICATION_TYPE,
  type NotificationType,
} from "@/types/app/notifications";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** key into the counts map passed to <Sidebar/>, renders an amber pill */
  badgeKey?: "pending";
  /**
   * sub menu — the item becomes a toggle instead of a link, and `href` is only
   * the path prefix its children share
   */
  children?: Omit<NavItem, "badgeKey" | "children">[];
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
  {
    href: ROUTES.settings,
    label: "ตั้งค่าระบบ",
    icon: Settings,
    children: [
      { href: ROUTES.signers, label: "ผู้มีอำนาจลงนาม", icon: UserPen },
      { href: ROUTES.signingWorkflows, label: "กระบวนการลงนาม", icon: ListOrdered },
      { href: ROUTES.roles, label: "บทบาทและสิทธิ์", icon: ShieldUser },
    ],
  },
];

/** shown on one line — the sidebar is sized to fit it (see Sidebar.tsx) */
export const APP_NAME = "ระบบการลงนามอนุมัติดิจิทัล";
export const APP_SUBTITLE = "E-Signature";
/**
 * Full system name shown above the TopBar breadcrumb — Figma login-hero
 * title. The "(E-Signature)" suffix is dropped below `sm`, where there's no
 * room for it and it would otherwise just get truncated with an ellipsis.
 */
export const SYSTEM_TITLE = "ระบบการลงนามอนุมัติด้วยลายมือชื่อดิจิทัล";
export const SYSTEM_TITLE_SUFFIX = "(E-Signature)";

/** Breadcrumb trail per route, rendered in the TopBar. */
export const BREADCRUMBS: Record<string, string[]> = {
  [ROUTES.reports]: ["หน้าหลัก", "รายงานภาพรวม"],
  [ROUTES.applications]: ["หน้าหลัก", "คำขอทั้งหมด"],
  [ROUTES.applicationsPending]: ["หน้าหลัก", "รอการอนุมัติ"],
  [ROUTES.profile]: ["หน้าหลัก", "โปรไฟล์ผู้ใช้งาน"],
  [ROUTES.settings]: ["หน้าหลัก", "ตั้งค่าระบบ"],
  [ROUTES.signingWorkflows]: ["หน้าหลัก", "ตั้งค่าระบบ", "กระบวนการลงนาม"],
  [ROUTES.signingWorkflowNew]: [
    "หน้าหลัก",
    "ตั้งค่าระบบ",
    "กระบวนการลงนาม",
    "เพิ่มกระบวนการลงนาม",
  ],
  [ROUTES.signers]: ["หน้าหลัก", "ตั้งค่าระบบ", "ผู้มีอำนาจลงนาม"],
  [ROUTES.signerNew]: [
    "หน้าหลัก",
    "ตั้งค่าระบบ",
    "ผู้มีอำนาจลงนาม",
    "เพิ่มผู้มีอำนาจลงนาม",
  ],
  [ROUTES.roles]: ["หน้าหลัก", "ตั้งค่าระบบ", "บทบาทและสิทธิ์"],
  [ROUTES.roleNew]: [
    "หน้าหลัก",
    "ตั้งค่าระบบ",
    "บทบาทและสิทธิ์",
    "เพิ่มบทบาท",
  ],
};

/**
 * The trail for `pathname`: an exact BREADCRUMBS entry, else the longest entry
 * it sits under — so /settings/signing-workflows/SW-001 inherits the
 * กระบวนการลงนาม trail instead of dropping to ตั้งค่าระบบ.
 */
export function getBreadcrumbs(pathname: string): string[] {
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname];
  const parent = Object.keys(BREADCRUMBS)
    .filter((href) => href !== "/" && pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  return parent ? BREADCRUMBS[parent] : ["หน้าหลัก"];
}

export function getInitials(name: string): string {
  return name.trim().slice(0, 2);
}

/**
 * The nav href that owns `pathname`, or undefined when none does.
 *
 * Plain prefix matching would light up both คำขอทั้งหมด and รอการอนุมัติ on
 * /applications/pending, so the longest matching href wins: /applications
 * still owns the detail pages (/applications/[id]) but yields the nested
 * route to its own entry.
 */
export function getActiveNavHref(pathname: string): string | undefined {
  return NAV_ITEMS.flatMap((item) =>
    item.children ? item.children.map((child) => child.href) : [item.href],
  )
    .filter(
      (href) => pathname === href || pathname.startsWith(`${href}/`),
    )
    .sort((a, b) => b.length - a.length)[0];
}

/**
 * Header notification panel — not in Figma. Icon + tint per kind, reusing the
 * status palette so a "new request" reads amber like รอการอนุมัติ.
 */
export const NOTIFICATION_META: Record<
  NotificationType,
  { icon: LucideIcon; className: string }
> = {
  [NOTIFICATION_TYPE.NEW_REQUEST]: {
    icon: FileText,
    className: "bg-status-pending-approval-bg text-status-pending-approval-fg",
  },
  [NOTIFICATION_TYPE.RESUBMITTED]: {
    icon: FilePen,
    className: "bg-status-returned-bg text-status-returned-fg",
  },
  [NOTIFICATION_TYPE.SIGNED]: {
    icon: FileCheck,
    className: "bg-status-approved-bg text-status-approved-fg",
  },
  [NOTIFICATION_TYPE.CERTIFICATE_EXPIRING]: {
    icon: ShieldAlert,
    className: "bg-status-rejected-bg text-status-rejected-fg",
  },
};
