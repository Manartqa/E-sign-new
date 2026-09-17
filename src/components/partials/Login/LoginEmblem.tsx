import { cn } from "@/lib/utils";

/** rotate about the element's own centre, not the SVG origin */
const SPIN_ABOUT_CENTER = "origin-center [transform-box:fill-box]";

/**
 * Not in Figma — the login hero's emblem, drawn from the user's reference
 * image (signed document + pen + signal, inside a crosshair target). Motion
 * follows hub.mnre.go.th: two dashed rings orbit in opposite directions
 * (their icon-category, 7s / 5s), and hovering spins the target half a turn
 * (their category-block, 1s). Decorative only — the <h1> below names the system.
 */
export function LoginEmblem({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      // intrinsic fallback: without it an SVG with only a viewBox stretches to
      // the full column width whenever the size-* class hasn't applied (e.g.
      // a stale stylesheet), which is what blew it up on a phone
      width="64"
      height="64"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("group", className)}
      aria-hidden
    >
      {/* orbiting dashed rings */}
      <circle
        cx="100"
        cy="100"
        r="96"
        strokeWidth="1.5"
        strokeDasharray="98 70"
        className={cn(
          "animate-orbit stroke-emblem-cyan opacity-40 motion-reduce:animate-none",
          SPIN_ABOUT_CENTER,
        )}
      />
      <circle
        cx="100"
        cy="100"
        r="89"
        strokeWidth="2"
        strokeDasharray="168 16"
        className={cn(
          "animate-orbit-reverse stroke-white opacity-15 motion-reduce:animate-none",
          SPIN_ABOUT_CENTER,
        )}
      />

      {/* target: thin ring + crosshair, half a turn on hover */}
      <g
        strokeWidth="1"
        className={cn(
          "stroke-emblem-cyan transition-transform duration-1000 motion-safe:group-hover:rotate-180",
          SPIN_ABOUT_CENTER,
        )}
      >
        <circle cx="100" cy="100" r="74" />
        <path d="M100 8V40M100 160V192M8 100H40M160 100H192" />
      </g>

      <circle cx="100" cy="100" r="60" className="fill-white/15" />

      {/* signal */}
      <g strokeWidth="3" className="stroke-emblem-cyan">
        <path d="M94.04 62.34A8 8 0 0 1 105.36 62.34" />
        <path d="M89.8 58.1A14 14 0 0 1 109.6 58.1" />
        <circle cx="99.7" cy="68" r="1.6" className="fill-emblem-cyan" />
      </g>

      {/* document, its right edge broken where the pen crosses it */}
      <g strokeWidth="3.5" className="stroke-white">
        <path d="M108.5 75H79a4 4 0 0 0-4 4v49.7a4 4 0 0 0 4 4h37.7a4 4 0 0 0 4-4V121" />
        <path d="M120.7 95.5V87.2L108.5 75v9a3 3 0 0 0 3 3h9.2" />
      </g>

      {/* text lines + signature */}
      <g strokeWidth="3.2" className="stroke-emblem-ink">
        <path d="M82.1 96.2H104.5M82.1 103.8H104.5" />
        <path d="M81.3 125.5C85 119 89.5 114.5 92.2 116.3C95 118 91 125 93.3 125.2C95.5 125.4 96.5 120.5 98.4 121.2C100 121.8 100 124.3 102 124.4C103.5 124.5 105 124.2 106.1 124.2" />
      </g>

      {/* pen, drawn along +x from its nib and turned onto the diagonal */}
      <g
        strokeWidth="3"
        className="stroke-white"
        transform="translate(108.8 122.8) rotate(-49.2)"
      >
        <path d="M0 0L7 -4H37A4 4 0 0 1 37 4H7Z" />
        <path d="M13 -4V4" />
        <path d="M22 8.5H37.5A4 4 0 0 0 41.5 4.5" />
      </g>
    </svg>
  );
}
