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
import { CHART_COLORS, CHART_STYLE } from "@/lib/charts/theme";
import ChartTooltip from "./ChartTooltip";

export interface CoachSegment {
  dataKey: string;
  label: string;
  color: string;
}

export interface CoachEloChartProps {
  data: Array<{ date: string; [key: string]: number | string | null | undefined }>;
  segments: CoachSegment[];
}

export default function CoachEloChart({ data, segments }: CoachEloChartProps) {
  const keyToLabel = new Map(segments.map((s) => [s.dataKey, s.label]));

  return (
    <ResponsiveContainer width="100%" height={380}>
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
            const entries = payload.map((p) => ({
              color: p.color ?? CHART_COLORS.gold,
              name: keyToLabel.get(p.dataKey as string) ?? (p.dataKey as string),
              value: Math.round(p.value as number),
            }));
            return <ChartTooltip label={String(label ?? "")} entries={entries} />;
          }}
        />
        {segments.map((seg) => (
          <Line
            key={seg.dataKey}
            type="monotone"
            dataKey={seg.dataKey}
            stroke={seg.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
        <Legend
          formatter={(value) => (
            <span
              style={{
                fontFamily: CHART_STYLE.fontFamily,
                fontSize: CHART_STYLE.fontSize,
                color: CHART_COLORS.parchment,
              }}
            >
              {keyToLabel.get(value) ?? value}
            </span>
          )}
          wrapperStyle={{ paddingTop: 16 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
