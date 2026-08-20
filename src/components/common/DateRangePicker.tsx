"use client";

import { useId, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatThaiShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DateRange {
  /** ISO date, inclusive */
  from?: string;
  /** ISO date, inclusive */
  to?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (next: DateRange) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** Every cell of the month grid, padded to whole weeks. */
function buildGrid(month: Dayjs): Dayjs[] {
  const start = month.startOf("month").startOf("week");
  const end = month.endOf("month").endOf("week");
  const days: Dayjs[] = [];

  for (let day = start; day.isBefore(end); day = day.add(1, "day")) {
    days.push(day);
  }

  return days;
}

/**
 * Two-click date range picker: the first click sets the start, the second the
 * end (clicking an earlier day restarts the range). Written against dayjs
 * rather than pulling in a calendar dependency, and shows Buddhist years to
 * match the rest of the app.
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "เลือกช่วงวันที่",
  className,
  triggerClassName,
}: DateRangePickerProps) {
  // a controlled base-ui popover only binds to its trigger when the two share
  // a triggerId — without it the trigger opens the popup but `open` cannot
  // close it again
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const [month, setMonth] = useState(() =>
    value.from ? dayjs(value.from) : dayjs(),
  );

  const from = value.from ? dayjs(value.from) : undefined;
  const to = value.to ? dayjs(value.to) : undefined;
  const days = useMemo(() => buildGrid(month), [month]);

  const label = from
    ? to
      ? `${formatThaiShortDate(from.toISOString())} - ${formatThaiShortDate(to.toISOString())}`
      : formatThaiShortDate(from.toISOString())
    : placeholder;

  const select = (day: Dayjs) => {
    // a completed range, or a click before the start, begins a new one
    if (!from || to || day.isBefore(from, "day")) {
      onChange({ from: day.startOf("day").toISOString() });
      return;
    }

    onChange({
      from: from.startOf("day").toISOString(),
      to: day.endOf("day").toISOString(),
    });
    close();
  };

  const clear = () => {
    onChange({});
    close();
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen} triggerId={triggerId}>
        <PopoverTrigger
          id={triggerId}
          className={cn(
            "flex items-center justify-between rounded-lg border bg-[#f8fafc] p-2.5 text-sm",
            from ? "text-foreground" : "text-slate-400",
            triggerClassName,
          )}
        >
          <span className="truncate">{label}</span>
          <span className="flex items-center gap-1">
            {from && (
              <X
                className="size-3.5 text-muted-foreground hover:text-foreground"
                role="button"
                aria-label="ล้างช่วงวันที่"
                onClick={(event) => {
                  event.stopPropagation();
                  clear();
                }}
              />
            )}
            <CalendarDays className="size-3.5" aria-hidden />
          </span>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[280px] p-3">
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              aria-label="เดือนก่อนหน้า"
              onClick={() => setMonth((m) => m.subtract(1, "month"))}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="text-sm font-semibold text-brand-navy-mid">
              {month.format("MMMM BBBB")}
            </span>
            <button
              type="button"
              aria-label="เดือนถัดไป"
              onClick={() => setMonth((m) => m.add(1, "month"))}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="text-[11px] text-slate-400">
                {weekday}
              </span>
            ))}

            {days.map((day) => {
              const outside = !day.isSame(month, "month");
              const isFrom = from && day.isSame(from, "day");
              const isTo = to && day.isSame(to, "day");
              const inRange =
                from && to && day.isAfter(from, "day") && day.isBefore(to, "day");

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => select(day)}
                  className={cn(
                    "mx-auto flex size-8 items-center justify-center rounded-md text-xs",
                    outside && "text-slate-300",
                    inRange && "bg-brand-navy-mid/10 text-brand-navy-mid",
                    (isFrom || isTo) &&
                      "bg-brand-navy-mid font-semibold text-white",
                    !isFrom && !isTo && "hover:bg-secondary",
                  )}
                >
                  {day.format("D")}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={clear}
              className="text-xs font-semibold text-muted-foreground hover:text-brand-navy-mid"
            >
              ล้าง
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-brand-navy-mid hover:bg-secondary"
            >
              ปิด
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
