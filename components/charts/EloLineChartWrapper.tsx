"use client";

import dynamic from "next/dynamic";
import type { EloDataPoint } from "./EloLineChart";

const EloLineChart = dynamic(() => import("./EloLineChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] flex items-center justify-center border border-rim">
      <span className="font-mono text-xs text-parchment-faint">Cargando gráfico…</span>
    </div>
  ),
});

export default function EloLineChartWrapper(props: { data: EloDataPoint[]; coaches: string[]; seasonBoundaries?: Array<{ date: string; label: string }> }) {
  return <EloLineChart {...props} />;
}
