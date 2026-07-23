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

export interface ContractTrendData {
  month: string;
  contracts: number;
  redeemed: number;
}

interface ContractTrendsChartProps {
  data?: ContractTrendData[];
}

export function ContractTrendsChart({ data = [] }: ContractTrendsChartProps) {
  return (
    <div className="min-w-0 min-h-0 rounded-lg border border-border-main bg-surface p-5 transition-colors duration-300">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Contract Trends
          </h3>
          <p className="text-xs text-text-tertiary">
            Monthly active contracts overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-green" />
            <span className="text-xs text-text-secondary">Contracts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span className="text-xs text-text-secondary">Redeemed</span>
          </div>
        </div>
      </div>

      <div className="h-64 min-w-0 min-h-0">
        <div className="h-full min-w-0 min-h-0" style={{ minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
          >
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            barCategoryGap="30%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              width={35}
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
              fill="var(--brand-green)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="redeemed"
              name="Redeemed"
              fill="var(--pawn-gold)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
