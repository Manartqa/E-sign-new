"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useApplicationStats } from "@/hooks/applications";
import { ErrorState, LoadingState } from "@/components/common";
import { usePermission, useProfile } from "@/hooks/profile";
import { getRequiredPermission } from "./AdminLayout.config";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { can, isLoading: permissionsLoading } = usePermission();
  const required = getRequiredPermission(pathname);
  const { stats } = useApplicationStats(
    !permissionsLoading && can("APPLICATIONS:VIEW"),
  );
  const pendingCount = stats?.pending ?? 0;

  const [menuOpen, setMenuOpen] = useState(false);

  // never leave the drawer covering a page the user just navigated to.
  // Adjusted during render rather than in an effect so the drawer is already
  // closed on the first paint of the new route (React docs: "adjusting state
  // when a prop changes").
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMenuOpen(false);
  }

  return (
    // the shell fills the viewport and only <main> scrolls, so the header
    // and sidebar stay put (dvh: phone browser bars don't hide the bottom)
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        user={profile}
        counts={{ pending: pendingCount }}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={profile} onOpenMenu={() => setMenuOpen(true)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 pt-1 sm:p-8 sm:pt-2">
          {/* a page is held back until the permissions are known, so it never
              fires requests the user isn't allowed to make */}
          {!required ? (
            children
          ) : permissionsLoading ? (
            <LoadingState rows={6} />
          ) : can(required) ? (
            children
          ) : (
            <ErrorState
              title="ไม่มีสิทธิ์เข้าถึงหน้านี้"
              description="บัญชีของคุณไม่ได้รับสิทธิ์ใช้งานเมนูนี้ กรุณาติดต่อผู้ดูแลระบบ"
            />
          )}
        </main>
      </div>
    </div>
  );
}
