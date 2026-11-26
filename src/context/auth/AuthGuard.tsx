"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { SESSION_EXPIRED_ERROR } from "@/constant/session";
import { logoutApp, logoutEverywhere } from "@/lib/logout";
import { currentAppPath, rememberSignOut } from "@/lib/return-path";

/**
 * Client-side backstop for the protected area; the proxy is the real gate.
 * Renders nothing until a live session is confirmed, and sends a missing or
 * dead (refresh failed) session through the full logout. A session past the
 * 8-hour limit signs out of this app only, and comes back to this page.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isExpired = session?.error === SESSION_EXPIRED_ERROR;
  const isDead =
    status === "unauthenticated" ||
    session?.error === "RefreshAccessTokenError" ||
    isExpired;

  useEffect(() => {
    if (!isDead) return;
    if (isExpired) {
      rememberSignOut(currentAppPath(), "EXPIRED");
      void logoutApp();
    } else {
      void logoutEverywhere();
    }
  }, [isDead, isExpired]);

  if (status === "loading" || !session || isDead) return null;
  return <>{children}</>;
}
