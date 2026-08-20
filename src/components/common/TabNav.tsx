"use client";

import { cn } from "@/lib/utils";

export interface TabNavItem {
  key: string;
  label: string;
}

interface TabNavProps {
  items: readonly TabNavItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

/** Figma: 🧩 Components › Tab Item (Active / Default) — node 67:635 */
export function TabNav({ items, value, onChange, className }: TabNavProps) {
  return (
    <div
      role="tablist"
      className={cn("flex items-center overflow-x-auto border-b", className)}
    >
      {items.map((item) => {
        const isActive = item.key === value;
        return (
          <button
            key={item.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={cn(
              "h-11 shrink-0 border-b-[3px] px-3 text-sm font-bold whitespace-nowrap transition-colors",
              isActive
                ? "border-brand-navy-mid text-brand-navy-mid"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
