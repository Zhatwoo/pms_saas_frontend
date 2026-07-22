"use client";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarCells(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** API `/inventory/for-sale-calendar` shape, or legacy plain count per date key. */
export interface SaleCalendarDayData {
  available?: number;
  sold?: number;
}

function resolveCounts(value: number | SaleCalendarDayData | undefined): { available: number; sold: number } {
  if (value == null) return { available: 0, sold: 0 };
  if (typeof value === "number") return { available: value, sold: 0 };
  return {
    available: Number(value.available) || 0,
    sold: Number(value.sold) || 0,
  };
}

interface SaleCalendarProps {
  calendarData: Record<string, number | SaleCalendarDayData>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  calendarYear: number;
  calendarMonth: number;
  onChangeMonth: (year: number, month: number) => void;
}

export function SaleCalendar({
  calendarData,
  selectedDate,
  onSelectDate,
  calendarYear,
  calendarMonth,
  onChangeMonth,
}: SaleCalendarProps) {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const cells = buildCalendarCells(calendarYear, calendarMonth);

  return (
    <div className="overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-green/90 to-brand-green px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => calendarMonth === 0 ? onChangeMonth(calendarYear - 1, 11) : onChangeMonth(calendarYear, calendarMonth - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:bg-white/10"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="min-w-[140px] text-center">
          <p className="text-lg font-bold leading-tight text-white">{MONTH_NAMES[calendarMonth]}</p>
          <p className="text-xs font-semibold text-pawn-gold">{calendarYear}</p>
        </div>
        <button
          type="button"
          onClick={() => calendarMonth === 11 ? onChangeMonth(calendarYear + 1, 0) : onChangeMonth(calendarYear, calendarMonth + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:bg-white/10"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-b border-zinc-200/80 bg-surface-secondary/60 px-4 py-1.5 dark:border-border-subtle">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-[10px] font-bold text-text-muted">Sold</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-4 rounded-full bg-emerald-500/70" />
          <span className="text-[10px] font-bold text-text-muted">Available</span>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-200/80 bg-surface-secondary dark:border-border-subtle">
        {DAY_NAMES.map((day) => (
          <div key={day} className="border-r border-zinc-200/80 py-2 text-center text-[10px] font-black uppercase tracking-widest text-text-muted last:border-r-0 dark:border-border-subtle">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-16 border-b border-r border-zinc-200/80 bg-surface-secondary/20 dark:border-border-subtle" />;
          }

          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const { available, sold } = resolveCounts(calendarData[dateStr]);
          const isToday = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === day;
          const isSelected = selectedDate === dateStr;
          const isFutureDate = dateStr > todayString;
          const hasSold = sold > 0;
          const hasAvailable = available > 0;

          const highlightClass = isSelected
            ? "bg-amber-500/10 ring-1 sm:ring-2 ring-inset ring-amber-400"
            : isToday
              ? "bg-yellow-500/10 ring-1 sm:ring-2 ring-inset ring-yellow-400"
              : hasSold
                ? "bg-amber-500/5"
                : "";

          const dayTextClass = isSelected
            ? "text-amber-400"
            : isToday
              ? "text-yellow-400"
              : hasSold || hasAvailable
                ? "text-text-primary"
                : "text-text-muted";

          return (
            <button
              key={day}
              type="button"
              disabled={isFutureDate}
              onClick={isFutureDate ? undefined : () => onSelectDate(isSelected ? null : dateStr)}
              className={`relative h-14 sm:h-16 md:h-20 border-b border-r border-zinc-200/80 p-1 sm:p-1.5 text-left transition-all dark:border-border-subtle ${isFutureDate ? "cursor-not-allowed opacity-45" : "hover:bg-amber-50/10"} ${highlightClass} ${isToday && !isSelected ? "ring-1 ring-inset ring-yellow-400" : ""}`}
            >
              <span className={`text-[10px] sm:text-xs font-bold leading-none ${dayTextClass}`}>
                {day}
              </span>

              {/* Bottom indicators */}
              <div className="absolute bottom-1 sm:bottom-1.5 left-1 sm:left-1.5 right-1 sm:right-1.5 flex flex-col gap-0.5">
                {hasSold && (
                  <div className="flex items-center gap-0.5 sm:gap-1 overflow-hidden">
                    <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="text-[8px] sm:text-[9px] font-black leading-none text-amber-400 truncate">
                      {sold} <span className="hidden sm:inline">sold</span>
                    </span>
                  </div>
                )}
                {hasAvailable && (
                  <div className="flex items-center gap-0.5 sm:gap-1 overflow-hidden">
                    <div className="h-1 flex-1 rounded-full bg-emerald-500/60" />
                    <span className="text-[8px] sm:text-[9px] font-black leading-none text-emerald-400">{available}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
