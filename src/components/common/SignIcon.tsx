import type { SVGProps } from "react";

/**
 * The system's "sign" icon — an outlined fountain pen writing a signature
 * (drawn for this app, 2026-09-21, after a user-supplied sketch). Stroked in
 * `currentColor` like the lucide icons it replaces, so a text-* class sets
 * its colour and size-* its size.
 */
export function SignIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* the pen, drawn upright from its nib (0,0), then leaned right */}
      <g transform="translate(14.8 21.9) rotate(15)">
        <path d="M-1.6 -5.6V-19.8a1.6 1.6 0 0 1 3.2 0V-5.6z" />
        <path d="M-1.6 -16h3.2" />
        <path d="M1.6 -19.6h1v6.2" />
        <path d="M-1.3 -5.6v1.3h2.6v-1.3" />
        <path d="M-1.3 -4.3v1.6L0 0l1.3-2.7v-1.6" />
        <circle cx="0" cy="-2.4" r=".35" fill="currentColor" stroke="none" />
      </g>
      {/* the signature it is writing */}
      <path d="M0.9 22.4C2.4 22.4 4.5 20.9 4.4 19.3 4.3 17.9 1.9 17.9 1.9 19.5 1.9 21 3 22.5 4.1 22.2 4.8 22 5.1 20.6 5.9 20.6 6.6 20.6 6.5 21.8 6.8 22.1 7.3 21.1 8 20.8 8.6 21.4 9.2 22 9.9 22 10.6 21.6 11.3 21.2 12 21.7 12.6 21.8 13 21.9 13.4 21.8 13.8 21.6" />
    </svg>
  );
}
