"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationStats } from "@/hooks/applications";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApplicationListParams } from "@/types/app/applications";
import { STAT_CARDS } from "./ApplicationList.config";

interface ApplicationStatCardsProps {
  activeStatus?: ApplicationListParams["status"];
  /** clicking a card filters the table below to that card's real status */
  onSelectStatus: (status: NonNullable<ApplicationListParams["status"]>) => void;
  /** the pending route's status is always pinned, so a ring there would just sit on รอการอนุมัติ forever — turn it off */
  showActiveRing?: boolean;
}

const COUNT_UP_MS = 600;

/**
 * Not in Figma: counts from 0 to `value` once, when the number first shows.
 * Later changes jump straight to the new value, and reduced motion skips it.
 */
function CountUp({ value }: { value: number }) {
  // null once the intro is over — from then on the live value renders as-is
  const [shown, setShown] = useState<number | null>(0);

  useEffect(() => {
    let frame = 0;
    let start: number | undefined;
    const tick = (now: number) => {
      start ??= now;
      const t = (now - start) / COUNT_UP_MS;
      if (t >= 1) return setShown(null);
      // ease-out cubic: fast start, settles onto the real number
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      frame = requestAnimationFrame(tick);
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    frame = requestAnimationFrame(reduce ? () => setShown(null) : tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intro runs once, on mount
  }, []);

  return <>{formatNumber(shown ?? value)}</>;
}

/** Figma: app-list › stat-card row (6:293) */
export function ApplicationStatCards({
  activeStatus,
  onSelectStatus,
  showActiveRing = true,
}: ApplicationStatCardsProps) {
  const { stats, isLoading } = useApplicationStats();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_CARDS.map(
        ({ key, label, icon: Icon, circleClassName, statusFilter }) => {
          const isActive =
            showActiveRing && (activeStatus ?? "all") === statusFilter;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectStatus(statusFilter)}
              aria-pressed={isActive}
              className={cn(
                // not in Figma: lift on hover, press back down on click
                "flex items-center gap-4 rounded-2xl bg-card p-6 text-left shadow-[0_4px_6px_rgba(0,0,0,0.03)] transition-[box-shadow,translate] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0",
                isActive && "ring-2 ring-brand-navy-mid ring-offset-2",
              )}
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full",
                  circleClassName,
                )}
              >
                <Icon className="size-6 text-white" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm text-muted-foreground">{label}</span>
                {isLoading || !stats ? (
                  <Skeleton className="mt-0.5 h-8 w-16" />
                ) : (
                  <span className="text-[28px] leading-tight font-bold text-brand-navy-mid">
                    <CountUp value={stats[key]} />
                  </span>
                )}
              </div>
            </button>
          );
        },
      )}
    </div>
  );
}
