import type { LicenseTypeShare } from "@/types/app/reports";

interface LicenseTypeDonutProps {
  shares: LicenseTypeShare[];
}

/** Slice colours in Figma order (8:387 → 8:403). */
const SLICE_COLORS = [
  "var(--color-brand-navy-mid)",
  "var(--color-action-approve)",
  "var(--color-action-return)",
  "var(--color-info)",
  "var(--color-brand-blue)",
];

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Figma: reports-dashboard › สัดส่วนตามประเภทใบอนุญาต (8:378).
 * The design exports the ring as a flat image; it is drawn here from the data
 * instead so the slices follow the real percentages.
 */
export function LicenseTypeDonut({ shares }: LicenseTypeDonutProps) {
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg
        viewBox="0 0 160 160"
        className="size-40 shrink-0 -rotate-90"
        role="img"
        aria-label="สัดส่วนตามประเภทใบอนุญาต"
      >
        {shares.map((share, index) => {
          const length = (share.percent / 100) * CIRCUMFERENCE;
          const dash = `${length} ${CIRCUMFERENCE - length}`;
          const strokeOffset = -offset;
          offset += length;

          return (
            <circle
              key={share.label}
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              strokeWidth="28"
              stroke={SLICE_COLORS[index % SLICE_COLORS.length]}
              strokeDasharray={dash}
              strokeDashoffset={strokeOffset}
            />
          );
        })}
      </svg>

      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {shares.map((share, index) => (
          <li key={share.label} className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
              }}
            />
            <span className="min-w-0 flex-1 text-[13px] text-foreground">
              {share.label}
            </span>
            <span className="text-[13px] font-bold text-black">
              {share.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
