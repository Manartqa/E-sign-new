"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { ROUTES } from "@/constant/routes";
import { APPLICATION_STATUS } from "@/constant/status";
import { useApplicationDetail } from "@/hooks/applications";
import { logoutEverywhere } from "@/lib/logout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "@/types/app/profile";
import { cn } from "@/lib/utils";
import {
  APP_NAME,
  APP_SUBTITLE,
  NAV_ITEMS,
  getActiveNavHref,
  getInitials,
} from "../AdminLayout.config";

interface SidebarProps {
  user: UserProfile | null;
  counts?: { pending?: number };
  /** drawer state, only meaningful below lg */
  open?: boolean;
  onClose?: () => void;
}

/** matches Tailwind's `lg` breakpoint (64rem / 1024px by default). */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

/**
 * Figma: 🧩 Components › Sidebar/Navigation — 240px, navy #0a1f44.
 *
 * The file has no narrow-screen design for the admin shell (only
 * `login-page-mobile`), so below `lg` this becomes a standard off-canvas
 * drawer rather than eating the content area. Above `lg` it can also
 * collapse to an icon-only rail — not in the design either, but requested
 * for reclaiming width on the list/table pages.
 *
 * The breakpoint is resolved in JS (not `lg:` utility variants) because the
 * collapsed width has to win over other components' width utilities that
 * happen to share the same unprefixed class in dev — a cross-chunk CSS
 * ordering quirk. Gating on a plain `isCollapsed` boolean sidesteps it.
 */
export function Sidebar({ user, counts, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  // an application detail page (/applications/:id) belongs to รอการอนุมัติ
  // while the request is still pending — the same rule as its back link —
  // so opening one from a notification doesn't light up คำขอทั้งหมด. The
  // detail query is shared with the page, so this adds no extra request.
  const detailId = pathname.match(/^\/applications\/(?!pending$)([^/]+)$/)?.[1];
  const { detail } = useApplicationDetail(detailId ?? "");
  const activeHref =
    detailId && detail?.summary.status === APPLICATION_STATUS.PENDING_APPROVAL
      ? ROUTES.applicationsPending
      : getActiveNavHref(pathname);
  // the group owning the active page opens on arrival and folds again when the
  // user leaves it for a page outside the group (adjusting state during render,
  // not in an effect); in between, the toggle is theirs to fold and unfold
  const activeGroup = NAV_ITEMS.find(
    (item) => item.children && activeHref?.startsWith(`${item.href}/`),
  )?.href;
  const [openGroup, setOpenGroup] = useState(activeGroup);
  const [prevActiveGroup, setPrevActiveGroup] = useState(activeGroup);
  if (activeGroup !== prevActiveGroup) {
    setPrevActiveGroup(activeGroup);
    setOpenGroup(activeGroup);
  }
  // every visible row, in order, for the sliding highlight; a folded group's
  // row stands in for its active child
  const rows = NAV_ITEMS.flatMap((item) =>
    item.children && openGroup === item.href
      ? [item.href, ...item.children.map((child) => child.href)]
      : [item.href],
  );
  const activeIndex = rows.indexOf(
    activeGroup && openGroup !== activeGroup ? activeGroup : (activeHref ?? ""),
  );
  const isDesktop = useIsDesktop();
  const [collapsedPref, setCollapsedPref] = useState(false);
  const isCollapsed = isDesktop && collapsedPref;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "flex shrink-0 flex-col gap-10 bg-sidebar p-5 transition-[width]",
          // 272px, not Figma's 240: fits APP_NAME on one line (163px bold at
          // 14px + 40px padding + 40px logo + 12px gap = 255px, plus slack)
          isCollapsed ? "w-20 px-3" : "w-68",
          // on desktop it fills the viewport-high shell (AdminLayout), which
          // keeps the user block below pinned to the bottom
          "fixed inset-y-0 left-0 z-50 overflow-y-auto max-lg:transition-transform lg:static",
          // only the drawer (below lg) is ever translated, so there is no
          // desktop utility left to override it
          open || "max-lg:-translate-x-full",
        )}
      >
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[20px] bg-white">
              <ShieldCheck className="size-7 text-brand-navy" aria-hidden />
            </span>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-col">
                <div className="text-xs font-bold whitespace-nowrap text-brand-on-navy lg:text-sm">
                  {APP_NAME}
                </div>
                <span className="text-[11px] text-brand-blue-muted">
                  {APP_SUBTITLE}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดเมนู"
              className="ml-auto shrink-0 text-brand-blue-muted lg:hidden"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCollapsedPref((c) => !c)}
            aria-label={isCollapsed ? "ขยายเมนู" : "ย่อเมนู"}
            className={cn(
              "hidden shrink-0 items-center gap-2 rounded-lg py-1.5 text-xs font-medium text-brand-blue-muted hover:bg-sidebar-accent/30 hover:text-white lg:flex",
              isCollapsed ? "justify-center px-1.5" : "px-2",
            )}
          >
            <Menu className="size-4 shrink-0" aria-hidden />
            {!isCollapsed && <span>หน้าหลัก</span>}
          </button>
        </div>

        <nav className="relative flex flex-col gap-1">
          {/* not in Figma: one shared highlight that glides to the active item
              instead of each item swapping its own background. Every item is
              44px tall (py-3 + 20px row), so the pill is h-11 and steps by its
              own height plus the gap-1 between items. */}
          {activeIndex >= 0 && (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-11 rounded-lg bg-sidebar-accent transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{
                transform: `translateY(calc(${activeIndex} * (100% + 0.25rem)))`,
              }}
            />
          )}
          {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey, children }) => {
            const badge = badgeKey ? counts?.[badgeKey] : undefined;

            if (children) {
              const isOpen = openGroup === href;
              return (
                <div key={href} className="contents">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isOpen ? undefined : href)}
                    aria-expanded={isOpen}
                    title={isCollapsed ? label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors",
                      isCollapsed && "justify-center px-2",
                      activeGroup === href
                        ? "font-semibold text-sidebar-accent-foreground"
                        : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/30",
                    )}
                  >
                    <Icon
                      className="size-5 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                      aria-hidden
                    />
                    {!isCollapsed && <span className="flex-1">{label}</span>}
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180",
                        isCollapsed && "absolute right-0.5 size-3",
                      )}
                      aria-hidden
                    />
                  </button>
                  {isOpen &&
                    children.map((child) => {
                      const isChildActive = child.href === activeHref;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          aria-current={isChildActive ? "page" : undefined}
                          title={isCollapsed ? child.label : undefined}
                          className={cn(
                            // h-11 like the top-level rows, which the sliding highlight relies on
                            "group relative flex h-11 items-center gap-3 rounded-lg pr-4 pl-12 text-sm transition-colors",
                            isCollapsed && "justify-center px-2",
                            isChildActive
                              ? "font-semibold text-sidebar-accent-foreground"
                              : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/30",
                          )}
                        >
                          <child.icon
                            className="size-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                            aria-hidden
                          />
                          {!isCollapsed && <span className="flex-1">{child.label}</span>}
                        </Link>
                      );
                    })}
                </div>
              );
            }

            const isActive = href === activeHref;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => {
                  // leaving for a page outside the group folds it, even when
                  // the group was opened by hand from another page
                  setOpenGroup(undefined);
                  onClose?.();
                }}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed ? label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "font-semibold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/30",
                )}
              >
                {/* not in Figma: the icon nudges right on hover */}
                <Icon
                  className="size-5 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
                  aria-hidden
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    {Boolean(badge) && (
                      <span className="rounded-xl bg-action-return px-2 py-0.5 text-[11px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {/* collapsed rail has no room for the count, so it becomes a plain dot */}
                {isCollapsed && Boolean(badge) && (
                  <span
                    className="absolute top-1.5 right-1.5 size-2 rounded-full bg-action-return"
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 border-t border-sidebar-border pt-5">
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center",
            )}
          >
            <Avatar className="size-10 border-2 border-white">
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user?.name ?? ""} />
              )}
              <AvatarFallback className="bg-sidebar-accent text-sm text-white">
                {getInitials(user?.name ?? "")}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-white">
                  {user?.name ?? "—"}
                </span>
                <span className="truncate text-[11px] text-brand-blue-muted">
                  {user?.position ?? ""}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void logoutEverywhere()}
            title={isCollapsed ? "ออกจากระบบ" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-accent/30",
              isCollapsed && "justify-center px-2",
            )}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            {!isCollapsed && "ออกจากระบบ"}
          </button>
        </div>
      </aside>
    </>
  );
}
