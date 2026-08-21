"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/types/app/profile";
import { cn } from "@/lib/utils";
import {
  APP_NAME_LINES,
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
  const activeHref = getActiveNavHref(pathname);
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
          isCollapsed ? "w-20 px-3" : "w-60",
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
                <div className="text-xs font-bold text-brand-on-navy lg:text-sm">
                  {APP_NAME_LINES.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
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

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
            const isActive = href === activeHref;
            const badge = badgeKey ? counts?.[badgeKey] : undefined;

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed ? label : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/30",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
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

        <div className="flex flex-col gap-4 border-t border-sidebar-border pt-5">
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center",
            )}
          >
            <Avatar className="size-10">
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
            onClick={() => void signOut({ callbackUrl: "/login" })}
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
