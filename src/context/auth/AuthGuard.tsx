"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { logoutEverywhere } from "@/lib/logout";

/**
 * Client-side backstop for the protected area; the proxy is the real gate.
 * Renders nothing until a live session is confirmed, and sends a missing or
 * dead (refresh failed) session through the full logout.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const isDead =
    status === "unauthenticated" || session?.error === "RefreshAccessTokenError";

  useEffect(() => {
    if (isDead) logoutEverywhere();
  }, [isDead]);

  if (status === "loading" || !session || isDead) return null;
  return <>{children}</>;
}
