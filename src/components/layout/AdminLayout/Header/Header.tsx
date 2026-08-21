"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constant/routes";
import type { UserProfile } from "@/types/app/profile";
import {
  BREADCRUMBS,
  SYSTEM_TITLE,
  SYSTEM_TITLE_SUFFIX,
  getInitials,
} from "../AdminLayout.config";

interface HeaderProps {
  user: UserProfile | null;
  hasNotification?: boolean;
  /** opens the sidebar drawer; the trigger only shows below lg */
  onOpenMenu?: () => void;
}

/** Figma: 🧩 Components › TopBar/detail (5 states) + Profile Dropdown Card */
export function Header({
  user,
  hasNotification = true,
  onOpenMenu,
}: HeaderProps) {
  const pathname = usePathname();
  const trail =
    BREADCRUMBS[pathname] ??
    BREADCRUMBS[`/${pathname.split("/")[1] ?? ""}`] ??
    ["หน้าหลัก"];

  return (
    <header className="flex min-h-topbar shrink-0 items-center justify-between gap-3 border-b bg-card px-4 py-4 sm:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="เปิดเมนู"
        className="shrink-0 text-muted-foreground lg:hidden"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-bold text-brand-navy-mid">
          {SYSTEM_TITLE}{" "}
          <span className="hidden sm:inline">{SYSTEM_TITLE_SUFFIX}</span>
        </span>
        <nav
          aria-label="breadcrumb"
          className="flex min-w-0 items-center gap-1 text-sm"
        >
          {trail.map((crumb, index) => (
            <span key={crumb} className="flex items-center gap-1">
              {index > 0 && (
                <span className="font-bold text-slate-400">/</span>
              )}
              <span className="text-muted-foreground">{crumb}</span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <button
          type="button"
          aria-label="การแจ้งเตือน"
          className="relative flex size-6 items-center justify-center"
        >
          <Bell className="size-6 text-muted-foreground" aria-hidden />
          {hasNotification && (
            <span className="absolute top-0 right-0 size-2 rounded border-2 border-white bg-destructive" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border py-1.5 pr-3 pl-2">
            <Avatar className="size-8">
              <AvatarFallback className="bg-secondary text-xs">
                {getInitials(user?.name ?? "")}
              </AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start gap-px md:flex">
              <span className="text-sm font-bold text-foreground">
                {user?.name ?? "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {user?.email ?? ""}
              </span>
            </span>
            <ChevronDown
              className="hidden size-3.5 text-muted-foreground md:block"
              aria-hidden
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-70 rounded-xl p-0 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)]"
          >
            <div className="flex flex-col gap-0.5 p-4">
              <span className="text-sm font-bold text-foreground">
                {user?.name ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.email ?? ""}
              </span>
            </div>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem
              className="gap-3 rounded-none px-4 py-3 text-sm"
              render={<Link href={ROUTES.profile} />}
            >
              <User className="size-5" aria-hidden />
              โปรไฟล์
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="gap-3 rounded-none px-4 py-3 text-sm"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-5" aria-hidden />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
