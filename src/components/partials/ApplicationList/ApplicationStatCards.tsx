"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useApplicationStats } from "@/hooks/applications";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STAT_CARDS } from "./ApplicationList.config";

/** Figma: app-list › stat-card row (6:293) */
export function ApplicationStatCards() {
  const { stats, isLoading } = useApplicationStats();

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_CARDS.map(({ key, label, icon: Icon, tileClassName, iconClassName }) => (
        <div
          key={key}
          className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-[0_4px_6px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                tileClassName,
              )}
            >
              <Icon className={cn("size-5", iconClassName)} aria-hidden />
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            {isLoading || !stats ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <span className="text-[28px] font-bold text-foreground">
                {formatNumber(stats[key])}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
