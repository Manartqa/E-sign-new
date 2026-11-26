"use client";

import { useEffect } from "react";

/**
 * A page the browser restores from its back/forward cache never asks the
 * server, so Back after logout could show signed-in data. Reloading such a
 * page sends it through the proxy, which redirects a dead session to /login
 * (legacy SSPF did the same in its layout).
 */
export function BfcacheReload() {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  return null;
}
