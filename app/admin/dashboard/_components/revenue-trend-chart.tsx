"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueTrendData {
  month: string;
  revenue: number;
}

interface RevenueTrendChartProps {
  data?: RevenueTrendData[];
}

export function RevenueTrendChart({ data = [] }: RevenueTrendChartProps) {
  return (
    <div className="rounded-lg border border-border-main bg-surface p-5 transition-colors duration-300">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Revenue Trend</h3>
        <p className="text-xs text-text-tertiary">Monthly revenue performance</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#71717a" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#71717a" }}
              ticks={[0, 1500, 3000, 4500, 6000]}
              domain={[0, 6000]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#1a472a"
              strokeWidth={2}
              dot={{ r: 4, fill: "#1a472a", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#1a472a", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
