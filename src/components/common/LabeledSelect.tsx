"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Shared trigger styling for every page's filter bar, so the report bar and the
 * application-list bar stay identical. The select primitive ships a 32px
 * trigger (`data-[size=default]:h-8`), which sits short next to a 42px search
 * box or date button — hence the height override, which must carry the
 * data-size prefix to win over the base rule.
 */
export const FILTER_TRIGGER = "bg-[#f8fafc] p-2.5 data-[size=default]:h-[42px]";

interface LabeledSelectProps {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  labelClassName?: string;
}

/**
 * A select with its label properly associated.
 *
 * Two things this fixes over using the primitive directly:
 * - `SelectValue` renders the raw value when the matching `SelectItem` is not
 *   mounted (Base UI only mounts items while the popup is open), which showed
 *   a literal "all" in the filter bars; the label is resolved here instead.
 * - the trigger gets an accessible name via aria-labelledby, which a bare
 *   <label> next to it does not provide.
 */
export function LabeledSelect({
  label,
  value,
  options,
  onChange,
  required,
  className,
  triggerClassName,
  labelClassName,
}: LabeledSelectProps) {
  const labelId = useId();
  const selected = options.find((option) => option.value === value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span id={labelId} className={cn("text-sm font-medium", labelClassName)}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>

      <Select value={value} onValueChange={(next) => onChange(next ?? value)}>
        <SelectTrigger
          aria-labelledby={labelId}
          className={cn("w-full rounded-lg border", triggerClassName)}
        >
          <SelectValue>{selected?.label ?? label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
