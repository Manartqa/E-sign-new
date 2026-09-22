"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronDown, KeyRound, LogOut, Menu, User } from "lucide-react";
import { toast } from "sonner";
import { logoutEverywhere } from "@/lib/logout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordModal } from "@/components/partials/Profile";
import { ROUTES } from "@/constant/routes";
import { SSO_PROVIDER_ID } from "@/constant/sso";
import type { UserProfile } from "@/types/app/profile";
import {
  SYSTEM_TITLE,
  SYSTEM_TITLE_SUFFIX,
  getInitials,
} from "../AdminLayout.config";
import { NotificationMenu } from "./NotificationMenu";

interface HeaderProps {
  user: UserProfile | null;
  /** opens the sidebar drawer; the trigger only shows below lg */
  onOpenMenu?: () => void;
}

/** Figma: 🧩 Components › TopBar/detail (5 states) + Profile Dropdown Card */
export function Header({ user, onOpenMenu }: HeaderProps) {
  const [changingPassword, setChangingPassword] = useState(false);
  // SSO users' passwords live in the SSO, not here
  const { data: session } = useSession();
  const isSsoUser = session?.provider === SSO_PROVIDER_ID;

  return (
    <header className="flex min-h-topbar shrink-0 items-center justify-between gap-3 border-b bg-card px-4 py-2 sm:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="เปิดเมนู"
        className="shrink-0 text-muted-foreground lg:hidden"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      {/* the sidebar carries the system name from `lg` up, so the bar only
          shows it while the sidebar is an off-canvas drawer */}
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-brand-navy-mid lg:hidden">
        {SYSTEM_TITLE}{" "}
        <span className="hidden sm:inline">{SYSTEM_TITLE_SUFFIX}</span>
      </span>

      {/* ml-auto: from `lg` up this is the bar's only child, and justify-between
          alone would leave it at the start */}
      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
        <NotificationMenu />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border py-1.5 pr-3 pl-2">
            <Avatar className="size-8">
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user?.name ?? ""} />
              )}
              <AvatarFallback className="bg-brand-blue text-xs text-white">
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
            <div className="flex items-center gap-3 p-4">
              <Avatar className="size-10 shrink-0">
                {user?.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user?.name ?? ""} />
                )}
                <AvatarFallback className="bg-brand-navy-mid text-sm text-white">
                  {getInitials(user?.name ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-bold text-foreground">
                  {user?.name ?? "—"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email ?? ""}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem
              className="gap-3 rounded-none px-4 py-3 text-sm"
              render={<Link href={ROUTES.profile} />}
            >
              <User className="size-5" aria-hidden />
              โปรไฟล์
            </DropdownMenuItem>
            {!isSsoUser && (
              <DropdownMenuItem
                className="gap-3 rounded-none px-4 py-3 text-sm"
                onClick={() => setChangingPassword(true)}
              >
                <KeyRound className="size-5" aria-hidden />
                เปลี่ยนรหัสผ่าน
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              className="gap-3 rounded-none px-4 py-3 text-sm"
              onClick={() => void logoutEverywhere()}
            >
              <LogOut className="size-5" aria-hidden />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* outside the dropdown: its content unmounts as soon as the menu closes */}
      {changingPassword && (
        <ChangePasswordModal
          open
          onClose={() => setChangingPassword(false)}
          onSuccess={() => {
            setChangingPassword(false);
            toast.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
          }}
        />
      )}
    </header>
  );
}
