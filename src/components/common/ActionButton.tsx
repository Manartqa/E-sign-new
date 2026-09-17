"use client";

import { Check, RotateCcw, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
} from "react";
import type { ActionMode } from "@/types/app/applications";
import { cn } from "@/lib/utils";

const ACTION_CONFIG = {
  approve: {
    label: "อนุมัติและลงนาม",
    Icon: Check,
    skin: "bg-action-approve border-transparent",
    text: "text-white",
    halo: "ring-action-approve/25",
    arc: "stroke-action-approve",
  },
  reject: {
    label: "ปฏิเสธคำขอ",
    Icon: X,
    skin: "border-action-reject",
    text: "text-action-reject",
    halo: "ring-action-reject/25",
    arc: "stroke-action-reject",
  },
  return: {
    label: "ส่งคืนเพื่อแก้ไข",
    Icon: RotateCcw,
    skin: "border-action-return",
    text: "text-action-return",
    halo: "ring-action-return/25",
    arc: "stroke-action-return",
  },
} as const satisfies Record<ActionMode, unknown>;

/**
 * Not in Figma — after dribbble.com/shots/6538291 ("Confirm button
 * animation"), compressed from its 8s loop to ~1.2s: the button pulses and
 * shrinks to a circle, a progress arc runs round it, it springs back open with
 * the action's icon, and only then does `onClick` fire (opening its modal).
 */
type Phase = "idle" | "shrink" | "load" | "done";
const TIMELINE: { phase: Phase; at: number }[] = [
  { phase: "load", at: 300 },
  { phase: "done", at: 800 },
];
const FIRE_AT = 1150;

interface ActionButtonProps extends ComponentProps<"button"> {
  action: ActionMode;
}

/** Figma: 🧩 Components › Button/Action (3 variants) — node 68:628 */
export function ActionButton({
  action,
  className,
  onClick,
  ...props
}: ActionButtonProps) {
  const { label, Icon, skin, text, halo, arc } = ACTION_CONFIG[action];
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (phase !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClick?.(event);
      return;
    }
    setPhase("shrink");
    timers.current = [
      ...TIMELINE.map(({ phase: next, at }) =>
        window.setTimeout(() => setPhase(next), at),
      ),
      window.setTimeout(() => {
        onClick?.(event);
        setPhase("idle");
      }, FIRE_AT),
    ];
  };

  const isCircle = phase === "shrink" || phase === "load";

  return (
    <button
      type="button"
      aria-busy={phase !== "idle" || undefined}
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-9 min-w-0 items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-bold sm:gap-2 sm:p-3 sm:text-xs",
        "transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-50",
        text,
        className,
      )}
      {...props}
    >
      {/* the visible button surface — shrinks to a 36px circle and back while
          the <button> keeps its size, so neighbouring buttons never shift */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-1/2 -translate-x-1/2 border transition-[width,border-radius,background-color,border-color,box-shadow] duration-300 ease-out",
          isCircle ? "rounded-[18px]" : "rounded-lg",
          phase === "load" ? "border-border bg-transparent" : skin,
          phase === "shrink" && cn("ring-4", halo),
        )}
        style={{ width: isCircle ? "2.25rem" : "100%" }}
      />

      <span
        className={cn(
          "relative flex min-w-0 items-center gap-0.5 transition-opacity duration-150 sm:gap-2",
          phase !== "idle" && "opacity-0",
        )}
      >
        <Icon className="size-3.5 shrink-0 sm:size-[18px]" aria-hidden />
        <span className="truncate">{label}</span>
      </span>

      {phase === "load" && (
        <svg
          viewBox="0 0 36 36"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="absolute top-0 left-1/2 size-9 -translate-x-1/2"
          aria-hidden
        >
          <circle
            cx="18"
            cy="18"
            r="16.5"
            pathLength={1}
            transform="rotate(-90 18 18)"
            className={cn("animate-draw", arc)}
          />
        </svg>
      )}

      {/* springs back open showing the action's own icon, not a generic tick */}
      {phase === "done" && (
        <Icon
          className="absolute top-1/2 left-1/2 size-4 -translate-1/2 animate-in duration-200 zoom-in-50 fade-in sm:size-5"
          strokeWidth={3}
          aria-hidden
        />
      )}
    </button>
  );
}
