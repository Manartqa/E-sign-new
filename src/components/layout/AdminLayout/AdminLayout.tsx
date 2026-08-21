"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useApplicationList } from "@/hooks/applications";
import { useProfile } from "@/hooks/profile";
import { APPLICATION_STATUS } from "@/constant/status";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { total: pendingCount } = useApplicationList({
    status: APPLICATION_STATUS.PENDING_APPROVAL,
    limit: 1,
  });

  const [menuOpen, setMenuOpen] = useState(false);

  // never leave the drawer covering a page the user just navigated to
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={profile}
        counts={{ pending: pendingCount }}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={profile} onOpenMenu={() => setMenuOpen(true)} />
        <main className="min-w-0 flex-1 p-4 pt-1 sm:p-8 sm:pt-2">{children}</main>
      </div>
    </div>
  );
}
