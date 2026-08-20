"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

/**
 * Figma: 🧩 Components › Sidebar/Navigation — 240px, navy #0a1f44.
 *
 * The file has no narrow-screen design for the admin shell (only
 * `login-page-mobile`), so below `lg` this becomes a standard off-canvas
 * drawer rather than eating the content area.
 */
export function Sidebar({ user, counts, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const activeHref = getActiveNavHref(pathname);

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
          "flex w-sidebar shrink-0 flex-col gap-10 bg-sidebar p-5",
          "fixed inset-y-0 left-0 z-50 overflow-y-auto max-lg:transition-transform lg:static",
          // only the drawer (below lg) is ever translated, so there is no
          // desktop utility left to override it
          open || "max-lg:-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[20px] bg-white">
            <ShieldCheck className="size-7 text-brand-navy" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-bold text-brand-on-navy">
              {APP_NAME}
            </span>
            <span className="text-[11px] text-brand-blue-muted">
              {APP_SUBTITLE}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดเมนู"
            className="ml-auto shrink-0 text-brand-blue-muted lg:hidden"
          >
            <X className="size-5" aria-hidden />
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
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/30",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="flex-1">{label}</span>
                {Boolean(badge) && (
                  <span className="rounded-xl bg-action-return px-2 py-0.5 text-[11px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 border-t border-sidebar-border pt-5">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-sidebar-accent text-sm text-white">
                {getInitials(user?.name ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-white">
                {user?.name ?? "—"}
              </span>
              <span className="truncate text-[11px] text-brand-blue-muted">
                {user?.position ?? ""}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-accent/30"
          >
            <LogOut className="size-4" aria-hidden />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
