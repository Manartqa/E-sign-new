"use client";

import { useSyncExternalStore } from "react";
import { formatRelative, formatThaiShortDate } from "@/lib/format";

/** "now" never changes for our purposes, so the store never notifies. */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Relative timestamps depend on "now", which differs between the server render
 * and the client. Render the absolute date first, then swap after mount so the
 * markup always matches during hydration.
 */
export function RelativeTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <time dateTime={iso} className={className}>
      {mounted ? formatRelative(iso) : formatThaiShortDate(iso)}
    </time>
  );
}
