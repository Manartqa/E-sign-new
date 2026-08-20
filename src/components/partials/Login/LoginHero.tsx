import Image from "next/image";
import { FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HERO_DEPARTMENT,
  HERO_FEATURES,
  HERO_FOOTER,
  HERO_MINISTRY,
  HERO_SUBTITLE,
  HERO_TITLE_LINES,
} from "./Login.config";

/** 120px grid, 5% white — Figma node 12:5 `grid-overlay` */
function GridOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-5"
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
        isCompact ? "gap-5 px-6 py-8" : "gap-8 px-16 py-14",
        className,
      )}
    >
      <GridOverlay />

      <div className="relative flex items-center gap-3">
        <Image
          src="/brand/emblem.png"
          alt={HERO_DEPARTMENT}
          width={80}
          height={80}
          className={cn(
            "shrink-0 rounded-full border-2 border-[#fffefc] object-contain",
            isCompact ? "size-14" : "size-20",
          )}
        />
        <div className="flex flex-col gap-1 text-xs text-white">
          <span className="opacity-90">{HERO_DEPARTMENT}</span>
          <span className="font-semibold opacity-75">{HERO_MINISTRY}</span>
        </div>
      </div>

      <div
        className={cn(
          "relative flex flex-col items-center gap-5",
          !isCompact && "flex-1 justify-center",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-[18px] border border-white/20 bg-white/10",
            isCompact ? "size-14" : "size-18",
          )}
        >
          <FileSignature
            className={cn("text-white", isCompact ? "size-7" : "size-[34px]")}
            aria-hidden
          />
        </span>

        <div className="flex flex-col gap-2 text-center">
          <h1
            className={cn(
              "font-bold text-[#fafcff]",
              isCompact ? "text-xl" : "text-[32px]",
            )}
          >
            {HERO_TITLE_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="text-xs text-brand-blue-muted">{HERO_SUBTITLE}</p>
        </div>

        {!isCompact && (
          <>
            <span className="h-px w-20 bg-white/20" />
            <ul className="flex flex-col gap-3">
              {HERO_FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5">
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
        <p className="relative text-xs text-white opacity-75">{HERO_FOOTER}</p>
      )}
    </div>
  );
}
