"use client";

import { useState } from "react";

interface CalendarProps {
  items: any[];
}

export function InventoryCalendar({ items }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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
      const itemDate = new Date(item.pawnDate);
      return itemDate.getDate() === day && itemDate.getMonth() === month && itemDate.getFullYear() === year;
    });
  };

  const statusColors: Record<string, string> = {
    Active: "bg-emerald-500",
    Redeemed: "bg-blue-500",
    Expired: "bg-rose-500",
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border-main bg-surface shadow-lg shadow-black/20">
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-950 to-emerald-900 p-6 text-white">
        <h3 className="text-xl font-black">{monthName} {year}</h3>
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
          <div key={day} className="border-x border-border-subtle/60 py-3 text-center text-[10px] font-black uppercase tracking-widest text-text-tertiary">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grow h-[600px]">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="border border-border-subtle bg-surface-secondary/30" />;
          
          const dayItems = getItemsForDay(day);
          
          return (
            <div key={day} className="group relative border border-border-subtle bg-surface p-2 transition-colors hover:bg-surface-hover">
              <span className="text-sm font-black text-text-secondary transition-colors group-hover:text-emerald-300">{day}</span>
              
              <div className="mt-1 space-y-1">
                {dayItems.slice(0, 3).map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 w-full rounded-full ${statusColors[item.status] || "bg-zinc-400"} opacity-70`}
                    title={`${item.itemName} (${item.status})`}
                  />
                ))}
                {dayItems.length > 3 && (
                  <p className="text-[8px] font-bold text-text-muted">+{dayItems.length - 3} more</p>
                )}
              </div>

              {dayItems.length > 0 && (
                <div className="absolute inset-0 z-10 flex flex-col justify-center bg-emerald-950/95 p-4 text-white opacity-0 transition-all group-hover:opacity-100">
                  <p className="text-[10px] font-black uppercase underline mb-2">Events Summary</p>
                  <p className="text-xs font-bold">{dayItems.length} Total Items</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-[8px] font-bold text-emerald-300 uppercase">Active: {dayItems.filter(v => v.status === "Active").length}</p>
                    <p className="text-[8px] font-bold text-rose-300 uppercase">Expired: {dayItems.filter(v => v.status === "Expired").length}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-6 border-t border-border-subtle bg-surface-secondary/80 p-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black uppercase text-text-tertiary">Active Pawn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-[10px] font-black uppercase text-text-tertiary">Redeemed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-[10px] font-black uppercase text-text-tertiary">Expired / Overdue</span>
        </div>
      </div>
    </div>
  );
}
