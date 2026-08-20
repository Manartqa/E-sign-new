"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/types/app/profile";
import { cn } from "@/lib/utils";
import {
  APP_NAME,
  APP_SUBTITLE,
  NAV_ITEMS,
  getInitials,
} from "../AdminLayout.config";

interface SidebarProps {
  user: UserProfile | null;
  counts?: { pending?: number };
}

/** Figma: 🧩 Components › Sidebar/Navigation — 240px, navy #0a1f44 */
export function Sidebar({ user, counts }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-sidebar shrink-0 flex-col gap-10 bg-sidebar p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[20px] bg-white">
          <ShieldCheck className="size-7 text-brand-navy" aria-hidden />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-brand-on-navy">{APP_NAME}</span>
          <span className="text-[11px] text-brand-blue-muted">{APP_SUBTITLE}</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          const badge = badgeKey ? counts?.[badgeKey] : undefined;

          return (
            <Link
              key={href}
              href={href}
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
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">
              {user?.name ?? "—"}
            </span>
            <span className="text-[11px] text-brand-blue-muted">
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
  );
}
