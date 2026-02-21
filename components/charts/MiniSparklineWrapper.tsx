"use client";

import dynamic from "next/dynamic";

const MiniSparkline = dynamic(() => import("./MiniSparkline"), {
  ssr: false,
  loading: () => <div className="h-14" />,
});

export default function MiniSparklineWrapper(props: {
  data: { elo: number; delta: number }[];
}) {
  return <MiniSparkline {...props} />;
}
