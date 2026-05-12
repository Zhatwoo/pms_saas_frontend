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

interface SaleCalendarProps {
  calendarData: Record<string, number>;
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
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20 transition-colors duration-300">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 to-emerald-900 px-4 py-4 sm:px-5">
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
          <p className="text-xs font-semibold text-emerald-300">{calendarYear}</p>
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

      <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-secondary">
        {DAY_NAMES.map((day) => (
          <div key={day} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-16 border-b border-r border-border-subtle/40 bg-surface-secondary/20" />;
          }

          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const count = calendarData[dateStr] ?? 0;
          const isToday = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === day;
          const isSelected = selectedDate === dateStr;
          const isFutureDate = dateStr > todayString;
          const highlightClass = isToday
            ? "bg-yellow-500/10 ring-2 ring-inset ring-yellow-400"
            : isSelected
              ? "bg-emerald-500/10 ring-2 ring-inset ring-emerald-500"
              : "";
          const dayTextClass = isToday
            ? "text-yellow-400"
            : isSelected
              ? "text-emerald-400"
              : count > 0
                ? "text-text-primary"
                : "text-text-muted";

          return (
            <button
              key={day}
              type="button"
              disabled={isFutureDate}
              onClick={isFutureDate ? undefined : () => onSelectDate(isSelected ? null : dateStr)}
              className={`relative h-16 border-b border-r border-border-subtle/40 p-1.5 text-left transition-all ${isFutureDate ? "cursor-not-allowed opacity-45" : "hover:bg-emerald-50/10"} ${highlightClass} ${isToday ? "ring-1 ring-inset ring-yellow-400" : ""}`}
            >
              <span className={`text-xs font-bold leading-none ${dayTextClass}`}>
                {day}
              </span>
              {count > 0 && (
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1">
                  <div className="h-1 flex-1 rounded-full bg-emerald-500/60" />
                  <span className="text-[9px] font-black leading-none text-emerald-400">{count}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}