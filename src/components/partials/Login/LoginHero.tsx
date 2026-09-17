import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  HERO_DEPARTMENT,
  HERO_FEATURES,
  HERO_FOOTER,
  HERO_MINISTRY,
  HERO_SUBTITLE,
  HERO_TITLE_LINES,
} from "./Login.config";
import { LoginEmblem } from "./LoginEmblem";

/**
 * Not in Figma: the hero's pieces arrive in sequence on load. The login page is
 * seen once per session, so it can afford a slower entrance than the app.
 */
const ENTER =
  "animate-in fade-in fill-mode-both duration-500 motion-reduce:animate-none";

/** 120px grid, 5% white — Figma node 12:5 `grid-overlay` (the drift is ours) */
function GridOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 animate-grid-drift opacity-5 motion-reduce:animate-none"
      style={{
        backgroundImage:
          "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
        backgroundSize: "120px 120px",
      }}
    />
  );
}

interface LoginHeroProps {
  /** `full` = the 792px desktop column, `compact` = the mobile header band */
  variant?: "full" | "compact";
  className?: string;
}

/** Figma: login-page › hero-column (12:4) and login-page-mobile › hero-area (32:561) */
export function LoginHero({ variant = "full", className }: LoginHeroProps) {
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden bg-gradient-to-b from-brand-navy to-brand-navy-mid",
        // phones get a tighter band so the whole sign-in card fits one screen
        isCompact
          ? "gap-3 px-6 py-4 sm:gap-5 sm:py-8"
          : "gap-8 px-16 py-14",
        className,
      )}
    >
      <GridOverlay />

      <div
        className={cn(
          "relative flex items-center gap-3",
          ENTER,
          "slide-in-from-top-2",
        )}
      >
        <Image
          src="/brand/emblem.png"
          alt={HERO_DEPARTMENT}
          width={80}
          height={80}
          className={cn(
            "shrink-0 rounded-full border-2 border-[#fffefc] object-contain",
            isCompact ? "size-11 sm:size-14" : "size-20",
          )}
        />
        <div className="flex flex-col gap-1 text-xs text-white">
          <span className="opacity-90">{HERO_DEPARTMENT}</span>
          <span className="font-semibold opacity-75">{HERO_MINISTRY}</span>
        </div>
      </div>

      <div
        className={cn(
          // flex-1 + justify-center keeps the emblem and title centred in
          // whatever height the hero ends up with (the compact hero grows on
          // tall phones — see LoginContent)
          "relative flex flex-1 flex-col items-center justify-center",
          isCompact ? "gap-2 sm:gap-5" : "gap-5",
        )}
      >
        <LoginEmblem
          className={cn(
            ENTER,
            "delay-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] zoom-in-75",
            isCompact ? "size-16 sm:size-28" : "size-44",
          )}
        />

        <div
          className={cn(
            "flex flex-col gap-2 text-center",
            ENTER,
            "delay-300 slide-in-from-bottom-2",
          )}
        >
          <h1
            className={cn(
              "font-bold text-[#fafcff]",
              isCompact ? "text-lg sm:text-xl" : "text-[32px]",
            )}
          >
            {HERO_TITLE_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          {/* phones drop the English repeat of the title to save a row */}
          <p
            className={cn(
              "text-xs text-brand-blue-muted",
              isCompact && "max-sm:hidden",
            )}
          >
            {HERO_SUBTITLE}
          </p>
        </div>

        {!isCompact && (
          <>
            <span className={cn("h-px w-20 bg-white/20", ENTER, "delay-500")} />
            <ul className="flex flex-col gap-3">
              {HERO_FEATURES.map(({ icon: Icon, label }, i) => (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-2.5",
                    ENTER,
                    "slide-in-from-left-2",
                  )}
                  style={{ animationDelay: `${550 + i * 80}ms` }}
                >
                  <Icon className="size-[18px] shrink-0 text-white" aria-hidden />
                  <span className="text-[13px] text-white opacity-90">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {!isCompact && (
        <p
          className={cn(
            "relative text-xs text-white opacity-75",
            ENTER,
            "delay-700",
          )}
        >
          {HERO_FOOTER}
        </p>
      )}
    </div>
  );
}
