"use client";

import { useEffect, useState } from "react";
import { formatRelative, formatThaiShortDate } from "@/lib/format";

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <time dateTime={iso} className={className}>
      {mounted ? formatRelative(iso) : formatThaiShortDate(iso)}
    </time>
  );
}
