import { cn } from "@/lib/utils";
import type { MonthlyPoint } from "@/types/app/reports";

interface MonthlyBarChartProps {
  points: MonthlyPoint[];
}

/**
 * Figma: reports-dashboard › ยอดคำขอรายเดือน (8:336).
 * The design draws bare bars — no axes, grid or tooltips — so this is plain
 * CSS rather than a charting dependency.
 */
export function MonthlyBarChart({ points }: MonthlyBarChartProps) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="flex h-65 items-end gap-2 pt-5">
      {points.map((point) => (
        <div
          key={point.label}
          className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
        >
          <div
            role="img"
            aria-label={`${point.label} ${point.value} คำขอ`}
            title={`${point.label}: ${point.value}`}
            style={{ height: `${(point.value / max) * 100}%` }}
            className={cn(
              "w-full rounded-t",
              point.highlighted ? "bg-action-return" : "bg-brand-navy-mid",
            )}
          />
          <span className="text-center text-[11px] text-muted-foreground">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}
