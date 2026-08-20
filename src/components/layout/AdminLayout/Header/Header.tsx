"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
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
import { BREADCRUMBS, getInitials } from "../AdminLayout.config";

interface HeaderProps {
  user: UserProfile | null;
  hasNotification?: boolean;
}

/** Figma: 🧩 Components › TopBar/detail (5 states) + Profile Dropdown Card */
export function Header({ user, hasNotification = true }: HeaderProps) {
  const pathname = usePathname();
  const trail =
    BREADCRUMBS[pathname] ??
    BREADCRUMBS[`/${pathname.split("/")[1] ?? ""}`] ??
    ["หน้าหลัก"];

  return (
    <header className="flex h-topbar shrink-0 items-center justify-between border-b bg-card px-8 py-4">
      <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm">
        {trail.map((crumb, index) => (
          <span key={crumb} className="flex items-center gap-1">
            {index > 0 && <span className="font-bold text-slate-400">/</span>}
            <span className="text-muted-foreground">{crumb}</span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-5">
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
            <span className="flex flex-col items-start gap-px">
              <span className="text-sm font-bold text-foreground">
                {user?.name ?? "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {user?.email ?? ""}
              </span>
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
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
