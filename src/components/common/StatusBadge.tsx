import { STATUS_META, type ApplicationStatus } from "@/constant/status";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

/** Figma: 🧩 Components › Status Badge (6 variants) — node 67:630 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", meta.dotClassName)} />
      {meta.label}
    </span>
  );
}
