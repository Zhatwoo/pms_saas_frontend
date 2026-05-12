"use client";

import { useEffect, useState } from "react";

interface CalendarProps {
  items: any[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}

export function InventoryCalendar({ items, selectedDate, onSelectDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    if (!selectedDate) return;
    const nextDate = new Date(`${selectedDate}T00:00:00`);
    if (!Number.isNaN(nextDate.getTime())) {
      setCurrentDate(nextDate);
    }
  }, [selectedDate]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Padding for the start of the month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push(d);
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const getItemsForDay = (day: number) => {
    return items.filter(item => {
      // Check for multiple possible date fields
      const rawDate = item.pawnDate || item.availableDate || item.date;
      if (!rawDate) return false;
      
      const itemDate = new Date(rawDate);
      itemDate.setHours(0, 0, 0, 0);
      return (
        itemDate.getDate() === day && 
        itemDate.getMonth() === month && 
        itemDate.getFullYear() === year
      );
    });
  };

  const selectedDayString = selectedDate ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDate.split("-")[2]).padStart(2, "0")}` : null;

  const statusColors: Record<string, string> = {
    Active: "bg-emerald-500",
    Redeemed: "bg-blue-500",
    Expired: "bg-rose-500",
    Available: "bg-emerald-500",
    Sold: "bg-amber-500",
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20">
      <div className="flex items-center justify-between bg-emerald-900 p-6 text-white">
        <h3 className="text-xl font-bold text-amber-400">{monthName} {year}</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentDate(new Date(year, month - 1))}
            className="rounded-lg border border-white/10 p-2 transition-colors hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button 
            onClick={() => setCurrentDate(new Date(year, month + 1))}
            className="rounded-lg border border-white/10 p-2 transition-colors hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-secondary/80">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="border-x border-border-subtle/60 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grow min-h-[500px]">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="border border-border-subtle bg-surface-secondary/30" />;
          
          const dayItems = getItemsForDay(day);
          const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isFutureDate = dateString > todayString;
          const isToday = dateString === todayString;
          const isSelected = selectedDate === dateString;
          const Cell = onSelectDate ? "button" : "div";
          const highlightClass = isToday
            ? "ring-2 ring-inset ring-yellow-400 bg-yellow-500/10"
            : isSelected
              ? "ring-2 ring-inset ring-emerald-500 bg-emerald-500/10"
              : "";
          const dayTextClass = isToday
            ? "text-yellow-400"
            : isSelected
              ? "text-emerald-400"
              : "text-text-secondary";
          
          return (
            <Cell
              key={day}
              type={onSelectDate ? "button" : undefined}
              disabled={Boolean(onSelectDate) && isFutureDate}
              onClick={onSelectDate && !isFutureDate ? () => onSelectDate(dateString) : undefined}
              className={`group relative border border-border-subtle bg-surface p-2 text-left transition-colors ${onSelectDate ? (isFutureDate ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:bg-emerald-50/10") : ""} ${highlightClass}`}
            >
              <span className={`text-sm font-bold ${dayTextClass}`}>{day}</span>
              
              <div className="mt-1 space-y-1">
                {dayItems.slice(0, 4).map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 w-full rounded-full ${statusColors[item.status] || "bg-zinc-400"} opacity-70`}
                    title={`${item.itemName} (${item.status})`}
                  />
                ))}
                {dayItems.length > 4 && (
                  <p className="text-[8px] font-bold text-text-muted">+{dayItems.length - 4} more</p>
                )}
              </div>

              {dayItems.length > 0 && (
                <div className="absolute inset-0 z-10 flex flex-col justify-center bg-emerald-950/95 p-4 text-white opacity-0 transition-all group-hover:opacity-100">
                  <p className="text-[10px] font-bold uppercase underline mb-2 tracking-wider">Day Summary</p>
                  <p className="text-xs font-bold">{dayItems.length} Total Items</p>
                  <div className="mt-2 space-y-1">
                    {(
                      Object.entries(
                        dayItems.reduce<Record<string, number>>((acc, curr) => {
                          acc[curr.status] = (acc[curr.status] || 0) + 1;
                          return acc;
                        }, {}),
                      ) as [string, number][]
                    ).map(([status, count]) => (
                      <p key={status} className="text-[9px] font-bold uppercase">
                        {status}: {count}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </Cell>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border-subtle bg-surface-secondary/80 p-4">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${color}`} />
            <span className="text-[10px] font-bold uppercase text-text-tertiary">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
