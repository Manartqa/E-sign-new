"use client";

import { useRef, useState } from "react";
import { formatNumber } from "@/lib/format";
import type { BreakdownItem } from "@/types/app/reports";

interface LicenseTypeDonutProps {
  items: BreakdownItem[];
  /** total request count shown in the ring's centre and used for percentages */
  total: number;
}

/** Slice colours in Figma order (8:387 → 8:403), extended to six categories. */
const SLICE_COLORS = [
  "var(--color-brand-navy-mid)",
  "var(--color-brand-blue)",
  "var(--color-action-approve)",
  "var(--color-action-return)",
  "var(--color-info)",
  "var(--color-action-reject)",
];
/** everything past the top six collapses into one muted "อื่นๆ" slice */
const OTHER_COLOR = "#cbd5e1";
const TOP_N = 6;

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function pctOf(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function LegendRow({
  color,
  label,
  value,
  total,
  muted,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
  muted?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-[13px]">
      <span
        className="size-3 shrink-0 rounded-[2px]"
        style={{ backgroundColor: color }}
      />
      <span
        className={
          "min-w-0 flex-1 truncate " +
          (muted ? "text-muted-foreground" : "text-foreground")
        }
        title={label}
      >
        {label}
      </span>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {formatNumber(value)}
      </span>
      <span className="w-9 shrink-0 text-right font-bold tabular-nums text-black">
        {pctOf(value, total)}%
      </span>
    </li>
  );
}

/**
 * Figma: reports-dashboard › สัดส่วนตามประเภทใบอนุญาต (8:378).
 * Handles high-cardinality data: the ring shows the top six categories plus an
 * aggregated "อื่นๆ" slice, while the scrollable legend lists every category
 * with its real count, so nothing is hidden.
 */
export function LicenseTypeDonut({ items, total }: LicenseTypeDonutProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<{
    label: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const restTotal = rest.reduce((sum, item) => sum + item.value, 0);

  const slices = [
    ...top.map((item, i) => ({
      ...item,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
    })),
    ...(restTotal > 0
      ? [{ label: "อื่นๆ", value: restTotal, color: OTHER_COLOR }]
      : []),
  ];

  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div
        ref={wrapRef}
        className="relative size-40 shrink-0"
        onMouseLeave={() => setActive(null)}
      >
        <svg
          viewBox="0 0 160 160"
          className="size-40 -rotate-90"
          role="img"
          aria-label="สัดส่วนการขออนุญาต"
        >
          {slices.map((slice) => {
            const length = (slice.value / total) * CIRCUMFERENCE;
            const dash = `${length} ${CIRCUMFERENCE - length}`;
            const strokeOffset = -offset;
            offset += length;

            return (
              <circle
                key={slice.label}
                cx="80"
                cy="80"
                r={RADIUS}
                fill="none"
                strokeWidth="28"
                stroke={slice.color}
                strokeDasharray={dash}
                strokeDashoffset={strokeOffset}
                className="cursor-pointer transition-opacity"
                opacity={active && active.label !== slice.label ? 0.45 : 1}
                onMouseMove={(e) => {
                  const rect = wrapRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setActive({
                    label: slice.label,
                    value: slice.value,
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">รวม</span>
          <span className="text-2xl font-bold text-brand-navy-mid">
            {formatNumber(total)}
          </span>
          <span className="text-[11px] text-muted-foreground">คำขอ</span>
        </div>

        {active && (
          <div
            className="pointer-events-none absolute z-20 w-max max-w-[220px] -translate-y-full rounded-lg border bg-white px-3 py-1.5 shadow-md"
            style={{ left: active.x + 8, top: active.y - 8 }}
          >
            <div className="text-[11px] leading-snug text-muted-foreground">
              {active.label}
            </div>
            <div className="text-sm font-bold text-brand-navy-mid">
              {formatNumber(active.value)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({pctOf(active.value, total)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      <ul className="flex w-full min-w-0 flex-1 flex-col gap-2.5 self-stretch">
        {top.map((item, i) => (
          <LegendRow
            key={item.label}
            color={SLICE_COLORS[i % SLICE_COLORS.length]}
            label={item.label}
            value={item.value}
            total={total}
          />
        ))}

        {restTotal > 0 && (
          <LegendRow
            color={OTHER_COLOR}
            label={`อื่นๆ (${rest.length} รายการ)`}
            value={restTotal}
            total={total}
            muted
          />
        )}
      </ul>
    </div>
  );
}
