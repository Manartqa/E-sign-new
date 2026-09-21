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
import type { PermissionKey } from "@/types/app/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** key into the counts map passed to <Sidebar/>, renders an amber pill */
  badgeKey?: "pending";
  /** needed to see the entry and open its pages; none = every user */
  permission?: PermissionKey;
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
  {
    href: ROUTES.applications,
    label: "คำขอทั้งหมด",
    icon: FileText,
    permission: "APPLICATIONS:VIEW",
  },
  {
    href: ROUTES.applicationsPending,
    label: "รอการอนุมัติ",
    icon: Clock,
    badgeKey: "pending",
    permission: "APPLICATIONS:VIEW",
  },
  {
    href: ROUTES.reports,
    label: "รายงานภาพรวม",
    icon: BarChart3,
    permission: "REPORTS:VIEW",
  },
  { href: ROUTES.profile, label: "โปรไฟล์ผู้ใช้งาน", icon: User },
  {
    href: ROUTES.settings,
    label: "ตั้งค่าระบบ",
    icon: Settings,
    children: [
      {
        href: ROUTES.signers,
        label: "ผู้มีอำนาจลงนาม",
        icon: UserPen,
        permission: "SIGNERS:VIEW",
      },
      {
        href: ROUTES.signingWorkflows,
        label: "กระบวนการลงนาม",
        icon: ListOrdered,
        permission: "SIGNING_WORKFLOWS:VIEW",
      },
      {
        href: ROUTES.roles,
        label: "บทบาทและสิทธิ์",
        icon: ShieldUser,
        permission: "ROLES:VIEW",
      },
    ],
  },
];

/**
 * The entries this user may see: children they lack the permission for are
 * dropped, and a group left with no children goes with them.
 */
export function getVisibleNavItems(
  can: (key: PermissionKey) => boolean,
): NavItem[] {
  const allowed = (item: { permission?: PermissionKey }) =>
    !item.permission || can(item.permission);

  return NAV_ITEMS.filter(allowed).flatMap((item) => {
    if (!item.children) return [item];
    const children = item.children.filter(allowed);
    return children.length ? [{ ...item, children }] : [];
  });
}

/** the permission the page at `pathname` needs, if any */
export function getRequiredPermission(
  pathname: string,
): PermissionKey | undefined {
  const href = getActiveNavHref(pathname);
  return NAV_ITEMS.flatMap((item) => [item, ...(item.children ?? [])]).find(
    (item) => item.href === href,
  )?.permission;
}

/** shown on one line — the sidebar is sized to fit it (see Sidebar.tsx) */
export const APP_NAME = "ระบบการลงนามอนุมัติดิจิทัล";
export const APP_SUBTITLE = "E-Signature";
/**
 * Full system name shown in the TopBar — Figma login-hero title. The
 * "(E-Signature)" suffix is dropped below `sm`, where there's no
 * room for it and it would otherwise just get truncated with an ellipsis.
 */
export const SYSTEM_TITLE = "ระบบการลงนามอนุมัติด้วยลายมือชื่อดิจิทัล";
export const SYSTEM_TITLE_SUFFIX = "(E-Signature)";

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
