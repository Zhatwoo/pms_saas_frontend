"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const salesData = [
  { date: "Mar 19", sales: 980000, type: "weekday" },
  { date: "Mar 20", sales: 1050000, type: "weekday" },
  { date: "Mar 21", sales: 1120000, type: "weekday" },
  { date: "Mar 22", sales: 850000, type: "weekend" },
  { date: "Mar 23", sales: 790000, type: "weekend" },
  { date: "Mar 24", sales: 1180000, type: "weekday" },
  { date: "Mar 25", sales: 1250000, type: "weekday" },
  { date: "Mar 26", sales: 1310000, type: "high" },
  { date: "Mar 27", sales: 1150000, type: "weekday" },
  { date: "Mar 28", sales: 1080000, type: "weekday" },
  { date: "Mar 29", sales: 880000, type: "weekend" },
  { date: "Mar 30", sales: 920000, type: "weekend" },
  { date: "Mar 31", sales: 1410800, type: "high" },
  { date: "Apr 1", sales: 1284500, type: "weekday" },
];

const barColorMap: Record<string, string> = {
  weekday: "#d4a843",
  high: "#1a472a",
  weekend: "#a1a1aa",
};

const trendTabs = ["Daily", "Weekly", "Monthly", "Yearly"];

function formatPesoShort(value: number): string {
  if (value >= 1000000) return `\u20B1${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `\u20B1${(value / 1000).toFixed(0)}K`;
  return `\u20B1${value}`;
}

function formatPesoFull(value: number): string {
  return `\u20B1${value.toLocaleString("en-PH")}`;
}

export function SalesTrendChart() {
  const [activeTab, setActiveTab] = useState("Daily");

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-emerald-900 px-4 py-3">
        <h3 className="text-sm font-bold text-pawn-gold">
          Historical Sales Trend
        </h3>
        <div className="flex gap-1">
          {trendTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1 text-[10px] font-bold transition-colors ${
                tab === activeTab
                  ? "bg-pawn-gold text-emerald-900"
                  : "text-emerald-300 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#71717a" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#71717a" }}
                tickFormatter={formatPesoShort}
              />
              <Tooltip
                formatter={(value) => [
                  formatPesoFull(Number(value)),
                  "Sales",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e4e4e7",
                  fontSize: "12px",
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="sales" name="Sales" radius={[4, 4, 0, 0]}>
                {salesData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColorMap[entry.type]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d4a843]" />
            <span className="text-[11px] text-zinc-600">Weekday Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1a472a]" />
            <span className="text-[11px] text-zinc-600">High Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#a1a1aa]" />
            <span className="text-[11px] text-zinc-600">Weekend</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
          <span>
            14-day average:{" "}
            <span className="font-semibold text-zinc-700">
              {formatPesoFull(1186320)}
            </span>
          </span>
          <span>&middot;</span>
          <span>
            Peak: Mar 31{" "}
            <span className="font-semibold text-zinc-700">
              {formatPesoFull(1410800)}
            </span>
          </span>
        </div>

        {/* Today highlight */}
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-pawn-gold" />
          <span className="text-xs font-medium text-emerald-800">
            {formatPesoFull(1284500)} Today
          </span>
        </div>
      </div>
    </div>
  );
}
