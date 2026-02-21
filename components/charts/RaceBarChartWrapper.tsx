"use client";

import dynamic from "next/dynamic";
import type { RaceBarData } from "./RaceBarChart";

const RaceBarChart = dynamic(() => import("./RaceBarChart"), {
  ssr: false,
  loading: () => (
    <div className="h-80 flex items-center justify-center">
      <span className="font-mono text-xs text-parchment-faint">Cargando gráfico…</span>
    </div>
  ),
});

export default function RaceBarChartWrapper(props: { data: RaceBarData[] }) {
  return <RaceBarChart {...props} />;
}
