"use client";

import type { ReactNode } from "react";
import { useApplicationList } from "@/hooks/applications";
import { useProfile } from "@/hooks/profile";
import { APPLICATION_STATUS } from "@/constant/status";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { profile } = useProfile();
  const { total: pendingCount } = useApplicationList({
    status: APPLICATION_STATUS.PENDING_APPROVAL,
    limit: 1,
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar user={profile} counts={{ pending: pendingCount }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={profile} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
