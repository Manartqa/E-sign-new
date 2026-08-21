import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MonthlyPoint } from "@/types/app/reports";

interface MonthlyBarChartProps {
  points: MonthlyPoint[];
}

/** abbreviations in the data → full names for the highlighted bar's tooltip */
const FULL_MONTH: Record<string, string> = {
  "ม.ค.": "มกราคม",
  "ก.พ.": "กุมภาพันธ์",
  "มี.ค.": "มีนาคม",
  "เม.ย.": "เมษายน",
  "พ.ค.": "พฤษภาคม",
  "มิ.ย.": "มิถุนายน",
  "ก.ค.": "กรกฎาคม",
  "ส.ค.": "สิงหาคม",
  "ก.ย.": "กันยายน",
  "ต.ค.": "ตุลาคม",
  "พ.ย.": "พฤศจิกายน",
  "ธ.ค.": "ธันวาคม",
};

/** rounds the axis up to a clean max and step, so the gridlines read evenly */
function niceScale(max: number, ticks: number) {
  const rough = max / ticks;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow;
  return { step, niceMax: step * ticks };
}

/**
 * Figma: reports-dashboard › ยอดคำขอรายเดือน (8:336).
 * Plain CSS bars over a derived y-axis + dashed gridlines; the current month
 * is amber and carries a persistent value tooltip, matching the design.
 */
export function MonthlyBarChart({ points }: MonthlyBarChartProps) {
  const rawMax = Math.max(...points.map((p) => p.value), 1);
  const { step, niceMax } = niceScale(rawMax, 5);

  const ticks: number[] = [];
  for (let v = niceMax; v >= 0; v -= step) ticks.push(v);

  return (
    <div className="flex gap-3">
      <div className="flex h-65 flex-col justify-between text-right text-[11px] tabular-nums text-muted-foreground">
        {ticks.map((t) => (
          <span key={t}>{formatNumber(t)}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-65">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-dashed border-border"
              style={{ top: `${(1 - t / niceMax) * 100}%` }}
              aria-hidden
            />
          ))}

          <div className="absolute inset-0 flex items-end gap-2">
            {points.map((point) => {
              const pct = (point.value / niceMax) * 100;

              return (
                <div
                  key={point.label}
                  className="relative flex h-full min-w-0 flex-1 items-end"
                >
                  {point.highlighted && (
                    <div
                      className="absolute left-1/2 z-10 -translate-x-1/2 rounded-lg border bg-white px-3 py-1.5 text-center whitespace-nowrap shadow-md"
                      style={{ bottom: `calc(${pct}% + 12px)` }}
                    >
                      <div className="text-[11px] text-muted-foreground">
                        {FULL_MONTH[point.label] ?? point.label}
                      </div>
                      <div className="text-sm font-bold text-brand-navy-mid">
                        {formatNumber(point.value)}
                      </div>
                      <span className="absolute top-full left-1/2 -mt-1 size-2 -translate-x-1/2 rotate-45 border-r border-b bg-white" />
                    </div>
                  )}

                  <div
                    role="img"
                    aria-label={`${point.label} ${point.value} คำขอ`}
                    title={`${point.label}: ${point.value}`}
                    style={{ height: `${pct}%` }}
                    className={cn(
                      "w-full rounded-t",
                      point.highlighted
                        ? "bg-action-return"
                        : "bg-brand-navy-mid",
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          {points.map((point) => (
            <span
              key={point.label}
              className="min-w-0 flex-1 text-center text-[11px] text-muted-foreground"
            >
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
