"use client";

import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

/**
 * Figma: 🧩 Components › Tab Item (Active / Default) — node 67:635.
 *
 * The file has no narrow-screen tab design, and there's no room below `sm`
 * to show every tab (they'd otherwise scroll horizontally with no
 * affordance hinting more are off-screen). So below `sm` this collapses
 * into a hamburger-triggered menu showing just the active tab's label —
 * one sub-menu item at a time — while `sm` and up keep the full tab row.
 */
export function TabNav({ items, value, onChange, className }: TabNavProps) {
  const active = items.find((item) => item.key === value);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex h-11 w-full items-center gap-2 border-b text-sm font-bold text-brand-navy-mid sm:hidden",
            className,
          )}
        >
          <Menu className="size-4 shrink-0" aria-hidden />
          {active?.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                "px-2 py-2",
                item.key === value && "font-bold text-brand-navy-mid",
              )}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        role="tablist"
        className={cn(
          "hidden items-center overflow-x-auto border-b sm:flex",
          className,
        )}
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
    </>
  );
}
