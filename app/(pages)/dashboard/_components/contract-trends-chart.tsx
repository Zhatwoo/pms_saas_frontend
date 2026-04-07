"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", contracts: 60, redeemed: 30 },
  { month: "Feb", contracts: 85, redeemed: 65 },
  { month: "Mar", contracts: 95, redeemed: 55 },
  { month: "Apr", contracts: 60, redeemed: 45 },
  { month: "May", contracts: 110, redeemed: 80 },
  { month: "Jun", contracts: 130, redeemed: 95 },
];

export function ContractTrendsChart() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Contract Trends
          </h3>
          <p className="text-xs text-zinc-500">
            Monthly active contracts overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
            <span className="text-xs text-zinc-600">Contracts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="text-xs text-zinc-600">Redeemed</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            barCategoryGap="30%"
            barGap={4}
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
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="contracts"
              name="Contracts"
              fill="#1a472a"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="redeemed"
              name="Redeemed"
              fill="#d4a843"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
