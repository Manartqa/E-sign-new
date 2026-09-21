"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { PUBLIC_BASE_PATH } from "@/constant/sso";

export function NextAuthProvider({ children }: { children: ReactNode }) {
  return (
    // without basePath next-auth calls /api/auth/* and 404s under a basePath
    <SessionProvider
      basePath={`${PUBLIC_BASE_PATH}/api/auth`}
      refetchOnWindowFocus
      refetchInterval={120}
    >
      {children}
    </SessionProvider>
  );
}
