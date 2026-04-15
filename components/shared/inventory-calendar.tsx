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
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="bg-emerald-900 p-6 flex items-center justify-between text-white">
        <h3 className="text-xl font-black">{monthName} {year}</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentDate(new Date(year, month - 1))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button 
            onClick={() => setCurrentDate(new Date(year, month + 1))}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 border-x border-zinc-100/50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grow h-[600px]">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="border border-zinc-50 bg-zinc-50/20" />;
          
          const dayItems = getItemsForDay(day);
          
          return (
            <div key={day} className="border border-zinc-50 p-2 hover:bg-emerald-50/20 transition-colors relative group">
              <span className="text-sm font-black text-zinc-300 group-hover:text-emerald-900 transition-colors">{day}</span>
              
              <div className="mt-1 space-y-1">
                {dayItems.slice(0, 3).map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 w-full rounded-full ${statusColors[item.status] || "bg-zinc-400"} opacity-70`}
                    title={`${item.itemName} (${item.status})`}
                  />
                ))}
                {dayItems.length > 3 && (
                  <p className="text-[8px] font-bold text-zinc-400">+{dayItems.length - 3} more</p>
                )}
              </div>

              {dayItems.length > 0 && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-emerald-900/90 p-4 transition-all z-10 text-white flex flex-col justify-center">
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

      <div className="bg-zinc-50 p-6 flex flex-wrap gap-6 border-t border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black uppercase text-zinc-500">Active Pawn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-[10px] font-black uppercase text-zinc-500">Redeemed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-[10px] font-black uppercase text-zinc-500">Expired / Overdue</span>
        </div>
      </div>
    </div>
  );
}
