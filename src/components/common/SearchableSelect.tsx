"use client";

import { useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SelectOption } from "./LabeledSelect";

interface SearchableSelectProps {
  id: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  invalid?: boolean;
}

/**
 * A select with a search box inside its popup, for lists too long to scan.
 * Rows are one line (36px) so the list shows exactly 10 before it scrolls;
 * a long label is truncated with its full text in the tooltip.
 */
export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "เลือก",
  searchPlaceholder = "ค้นหา",
  isLoading,
  invalid,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const selected = options.find((option) => option.value === value);
  const term = keyword.trim().toLowerCase();
  const matches = term
    ? options.filter((option) => option.label.toLowerCase().includes(term))
    : options;

  const close = () => {
    setOpen(false);
    setKeyword("");
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <PopoverTrigger
          id={id}
          aria-invalid={invalid || undefined}
          className="flex min-h-11 w-full items-center gap-2 rounded-lg border bg-white py-2 pr-9 pl-3 text-left text-sm outline-none focus-visible:border-brand-navy-mid aria-invalid:border-destructive"
        >
          <span className={cn("flex-1", !value && "text-slate-400")}>
            {/* a saved value missing from the list still shows as-is */}
            {selected?.label ?? (value || placeholder)}
          </span>
          {!value && (
            <ChevronDown
              className="absolute right-3 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          )}
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="flex w-(--anchor-width) min-w-72 flex-col gap-2 p-2"
        >
          <div className="flex items-center gap-2 rounded-lg border px-2.5 py-2 focus-within:border-brand-navy-mid">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* 10 rows × 36px, then scroll */}
          <ul className="max-h-90 overflow-y-auto [scrollbar-width:thin]">
            {isLoading ? (
              <li className="px-2.5 py-3 text-center text-sm text-muted-foreground">
                กำลังโหลด...
              </li>
            ) : matches.length === 0 ? (
              <li className="px-2.5 py-3 text-center text-sm text-muted-foreground">
                ไม่พบรายการที่ค้นหา
              </li>
            ) : (
              matches.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      title={option.label}
                      onClick={() => {
                        onChange(option.value);
                        close();
                      }}
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-secondary",
                        isSelected && "bg-brand-navy-mid/5 font-semibold text-brand-navy-mid",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {isSelected && <Check className="size-4 shrink-0" aria-hidden />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>

      {/* outside the trigger: a button can't nest in a button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="ล้างค่าที่เลือก"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
