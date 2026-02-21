"use client";

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
import { CHART_COLORS, CHART_STYLE } from "@/lib/charts/theme";
import ChartTooltip from "./ChartTooltip";

export interface RaceBarData {
  rosterName: string;
  winPct: number;
}

interface RaceBarChartProps {
  data: RaceBarData[];
}

export default function RaceBarChart({ data }: RaceBarChartProps) {
  const sorted = [...data].sort((a, b) => b.winPct - a.winPct);

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 32)}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={CHART_COLORS.rim}
          horizontal={false}
        />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: CHART_COLORS.parchmentFaint, fontSize: CHART_STYLE.fontSize, fontFamily: CHART_STYLE.fontFamily }}
          axisLine={{ stroke: CHART_COLORS.rim }}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="rosterName"
          width={100}
          tick={{ fill: CHART_COLORS.parchment, fontSize: CHART_STYLE.fontSize, fontFamily: CHART_STYLE.fontFamily }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: CHART_COLORS.elevated }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0];
            return (
              <ChartTooltip
                label={d.payload?.rosterName}
                entries={[{ color: CHART_COLORS.gold, name: "Win %", value: `${(d.value as number).toFixed(1)}%` }]}
              />
            );
          }}
        />
        <Bar dataKey="winPct" radius={[0, 2, 2, 0]} maxBarSize={20}>
          {sorted.map((entry, i) => (
            <Cell
              key={entry.rosterName}
              fill={i === 0 ? CHART_COLORS.goldBright : i < 3 ? CHART_COLORS.gold : CHART_COLORS.goldDim}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
