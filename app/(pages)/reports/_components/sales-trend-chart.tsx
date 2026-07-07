"use client";

import { useState, useEffect, useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Bar,
  ComposedChart,
} from "recharts";

const barColorMap: Record<string, string> = {
  weekday: "#d4a843",
  high: "#1a472a",
  weekend: "#a1a1aa",
};


function formatPesoShort(value: number): string {
  if (value >= 1000000) return `\u20B1${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `\u20B1${(value / 1000).toFixed(0)}K`;
  return `\u20B1${value.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPesoFull(value: number): string {
  return `\u20B1${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface SalesTrendEntry {
  date: string;
  sales: number;
  type: string;
}

interface SalesTrendChartProps {
  data?: SalesTrendEntry[];
  summary?: {
    average: number;
    peakDate: string;
    peakSales: number;
  };
  todaySales?: number;
  activePeriod?: string;
  selectionLabel?: string;
}

export function SalesTrendChart({ 
  data = [], 
  summary, 
  todaySales = 0, 
  activePeriod = "Daily",
  selectionLabel,
}: SalesTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (activePeriod.toLowerCase() === "yearly") {
      // Aggregate by month — backend returns "Jan 1", "Jan 2" etc.
      const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthMap: Record<string, number> = {};
      monthOrder.forEach(m => { monthMap[m] = 0; });

      data.forEach(item => {
        const monthPrefix = item.date.split(" ")[0];
        if (monthPrefix && monthMap[monthPrefix] !== undefined) {
          monthMap[monthPrefix] += item.sales;
        }
      });

      return monthOrder.map(m => ({ date: m, sales: monthMap[m], type: "weekday" }));
    }

    if (activePeriod.toLowerCase() === "monthly") {
      // Show day-of-month numbers — backend returns "Apr 1", "Apr 2" etc.
      return data.map(item => ({
        ...item,
        date: item.date.split(" ")[1] ?? item.date,
      }));
    }

    // Weekly and Daily — show exact dates as returned by backend e.g. "Apr 28"
    return data;
  }, [data, activePeriod]);

  return (
    <div className="min-w-0 w-full overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-emerald-900 px-4 py-3">
        <h3 className="text-sm font-bold text-pawn-gold">
          Historical Sales Trend
        </h3>
        {activePeriod && (
          <span className="rounded-md bg-pawn-gold px-3 py-1 text-[10px] font-bold text-emerald-900">
            {activePeriod}
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-text-tertiary">
            No sales trend data available
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    tickFormatter={formatPesoShort}
                  />
                  <Tooltip
                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value) => [
                      formatPesoFull(Number(value)),
                      "Sales",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                      fontSize: "12px",
                      padding: "10px",
                    }}
                    labelStyle={{ fontWeight: 700, marginBottom: "4px", color: "#111827" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    animationDuration={1500}
                  />
                  <Bar 
                    dataKey="sales" 
                    barSize={6} 
                    fill="#d4a843" 
                    radius={[4, 4, 0, 0]} 
                    opacity={0.7}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-6 rounded-full bg-[#10b981]" />
                <span className="text-[11px] font-medium text-text-secondary">Trend line</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d4a843] opacity-70" />
                <span className="text-[11px] font-medium text-text-secondary">Sales Volume</span>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="mt-3 flex flex-col gap-1 text-xs text-text-tertiary sm:flex-row sm:items-center sm:gap-2">
                <span>
                  14-day average:{" "}
                  <span className="font-semibold text-zinc-700">
                    {formatPesoFull(summary.average)}
                  </span>
                </span>
                <span>&middot;</span>
                <span>
                  Peak: {summary.peakDate}{" "}
                  <span className="font-semibold text-zinc-700">
                    {formatPesoFull(summary.peakSales)}
                  </span>
                </span>
              </div>
            )}

            {/* Today highlight */}
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-surface px-3 py-1.5 ring-1 ring-emerald-500/20">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">
                {formatPesoFull(todaySales)} — {selectionLabel}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
