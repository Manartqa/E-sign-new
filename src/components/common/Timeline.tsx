import { Check } from "lucide-react";
import type { TimelineEvent } from "@/types/app/applications";
import { formatThaiDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

/** Figma: 🧩 Components › Timeline Item (Completed / Pending / Last) — node 67:660 */
export function Timeline({ events, className }: TimelineProps) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isPending = event.status === "PENDING";

        return (
          <li key={event.id} className="flex items-start gap-3">
            <div className="flex w-5 shrink-0 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full",
                  isPending ? "bg-action-return" : "bg-action-approve",
                )}
              >
                {!isPending && (
                  <Check className="size-3 text-white" strokeWidth={3} aria-hidden />
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
