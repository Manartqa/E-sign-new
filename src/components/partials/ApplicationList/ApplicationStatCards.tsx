"use client";

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
                "flex items-center gap-4 rounded-2xl bg-card p-6 text-left shadow-[0_4px_6px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md",
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
                    {formatNumber(stats[key])}
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
