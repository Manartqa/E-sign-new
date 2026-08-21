import { useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  /** colour comes from the text colour via currentColor */
  className?: string;
}

/** internal drawing space; the SVG is stretched to its box, stroke stays crisp */
const W = 120;
const H = 36;
const PAD = 4;

/**
 * Builds a smooth cubic path through the points with a Catmull-Rom spline, so
 * the trend line reads as a soft curve rather than sharp zig-zags. Returns the
 * "C…" segments only (no leading move), so both the line and the fill can reuse
 * them.
 */
function smoothSegments(pts: readonly (readonly [number, number])[]): string {
  const seg: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    seg.push(
      `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`,
    );
  }
  return seg.join(" ");
}

/**
 * The trend sparkline on each KPI card (Figma 8:310). Pure SVG, normalised to
 * its own min/max, drawn as a smooth curve. Colour is inherited from
 * `currentColor`, so the caller sets it with a text-* token.
 */
export function Sparkline({ data, className }: SparklineProps) {
  // stable, SSR-safe id; colons stripped so url(#…) references parse everywhere
  const fillId = `spark-${useId().replace(/:/g, "")}`;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = W / (data.length - 1);

  const points = data.map((value, i) => {
    const x = i * stepX;
    const y = PAD + (1 - (value - min) / span) * (H - 2 * PAD);
    return [x, y] as const;
  });

  const first = points[0];
  const segments = smoothSegments(points);
  const line = `M${first[0].toFixed(1)},${first[1].toFixed(1)} ${segments}`;
  const area = `M0,${H} L${first[0].toFixed(1)},${first[1].toFixed(1)} ${segments} L${W},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-9 w-full", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        {/* fade the fill out toward the baseline so it reads as an area under
            the curve, not a flat block pasted onto the card */}
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.24} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
