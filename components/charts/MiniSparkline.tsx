"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS, CHART_STYLE } from "@/lib/charts/theme";

interface SparklinePoint {
  elo: number;
  delta: number;
}

interface MiniSparklineProps {
  data: SparklinePoint[];
}

export default function MiniSparkline({ data }: MiniSparklineProps) {
  if (data.length < 2) return null;

  const first = data[0].elo;
  const last = data[data.length - 1].elo;
  const trend = last >= first ? CHART_COLORS.win : CHART_COLORS.loss;

  return (
    <ResponsiveContainer width="100%" height={56}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <Line
          type="monotone"
          dataKey="elo"
          stroke={trend}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0, fill: trend }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as SparklinePoint;
            const sign = d.delta >= 0 ? "+" : "";
            return (
              <div
                className="border border-rim px-2 py-1 text-xs font-mono"
                style={{ background: "#1c1710" }}
              >
                <span className="text-parchment">{Math.round(d.elo)}</span>
                <span
                  className="ml-2"
                  style={{ color: d.delta >= 0 ? CHART_COLORS.win : CHART_COLORS.loss }}
                >
                  {sign}{Math.round(d.delta)}
                </span>
              </div>
            );
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
