"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useState } from "react";
import { CHART_COLORS, CHART_STYLE } from "@/lib/charts/theme";
import ChartTooltip from "./ChartTooltip";

export interface EloDataPoint {
  date: string;
  [coachName: string]: number | string;
}

interface EloLineChartProps {
  data: EloDataPoint[];
  coaches: string[];
  seasonBoundaries?: Array<{ date: string; label: string }>;
}

export default function EloLineChart({ data, coaches, seasonBoundaries }: EloLineChartProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggleCoach = (name: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.rim}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tick={{ fill: CHART_COLORS.parchmentFaint, fontSize: CHART_STYLE.fontSize, fontFamily: CHART_STYLE.fontFamily, angle: -40, textAnchor: "end" } as any}
            axisLine={{ stroke: CHART_COLORS.rim }}
            tickLine={false}
            height={52}
            interval={Math.max(0, Math.ceil(data.length / 7) - 1)}
          />
          <YAxis
            tick={{ fill: CHART_COLORS.parchmentFaint, fontSize: CHART_STYLE.fontSize, fontFamily: CHART_STYLE.fontFamily }}
            axisLine={false}
            tickLine={false}
            width={48}
            domain={["auto", "auto"]}
          />
          <ReferenceLine
            y={1000}
            stroke={CHART_COLORS.goldDim}
            strokeDasharray="4 4"
            label={{ value: "1000", fill: CHART_COLORS.goldDim, fontSize: 10, fontFamily: CHART_STYLE.fontFamily }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const entries = payload
                .filter((p) => !hidden.has(p.dataKey as string))
                .map((p) => ({
                  color: p.color ?? CHART_COLORS.gold,
                  name: p.dataKey as string,
                  value: Math.round(p.value as number),
                }));
              return <ChartTooltip label={String(label ?? "")} entries={entries} />;
            }}
          />
          {(seasonBoundaries ?? []).map((b) => (
            <ReferenceLine
              key={b.date}
              x={b.date}
              stroke={CHART_COLORS.goldDim}
              strokeDasharray="4 2"
              label={{
                value: b.label,
                fill: CHART_COLORS.gold,
                fontSize: 9,
                fontFamily: CHART_STYLE.fontFamily,
                position: "insideTopLeft",
              }}
            />
          ))}
          {coaches.map((coach, i) => (
            <Line
              key={coach}
              type="monotone"
              dataKey={coach}
              stroke={CHART_COLORS.series[i % CHART_COLORS.series.length]}
              strokeWidth={hidden.has(coach) ? 0 : 2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
            />
          ))}
          <Legend
            onClick={(e) => toggleCoach(e.dataKey as string)}
            formatter={(value) => (
              <span
                style={{
                  fontFamily: CHART_STYLE.fontFamily,
                  fontSize: CHART_STYLE.fontSize,
                  color: hidden.has(value) ? CHART_COLORS.parchmentFaint : CHART_COLORS.parchment,
                  cursor: "pointer",
                  textDecoration: hidden.has(value) ? "line-through" : "none",
                }}
              >
                {value}
              </span>
            )}
            wrapperStyle={{ paddingTop: 16 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
