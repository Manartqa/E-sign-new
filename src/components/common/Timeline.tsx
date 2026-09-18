import { Check, RotateCcw, X, type LucideIcon } from "lucide-react";
import type { TimelineEvent } from "@/types/app/applications";
import { formatThaiDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

/**
 * Figma draws Completed (green tick) and Pending (plain amber dot) only. A
 * chain that stopped at a signer gets its own marker so the outcome reads at a
 * glance: the icon carries the meaning, since RETURNED shares Pending's amber.
 */
const MARKER: Record<
  TimelineEvent["status"],
  { className: string; Icon?: LucideIcon }
> = {
  COMPLETED: { className: "bg-action-approve", Icon: Check },
  PENDING: { className: "bg-action-return" },
  REJECTED: { className: "bg-action-reject", Icon: X },
  RETURNED: { className: "bg-action-return", Icon: RotateCcw },
};

/** Figma: 🧩 Components › Timeline Item (Completed / Pending / Last) — node 67:660 */
export function Timeline({ events, className }: TimelineProps) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isPending = event.status === "PENDING";
        const { className: markerClassName, Icon } = MARKER[event.status];

        return (
          <li key={event.id} className="flex items-start gap-3">
            <div className="flex w-5 shrink-0 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full",
                  markerClassName,
                )}
              >
                {Icon && (
                  <Icon className="size-3 text-white" strokeWidth={3} aria-hidden />
                )}
              </span>
              {!isLast && <span className="h-7 w-0.5 rounded-[1px] bg-border" />}
            </div>

            <div className={cn("flex flex-col gap-1", isLast ? "pb-0" : "pb-3")}>
              <p className="text-sm font-bold text-brand-navy-mid">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {isPending
                  ? "รอดำเนินการ"
                  : `${formatThaiDateTime(event.at)} • ${event.actor}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
