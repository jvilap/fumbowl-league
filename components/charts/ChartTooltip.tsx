interface TooltipEntry {
  color: string;
  name: string;
  value: number | string;
}

interface ChartTooltipProps {
  label?: string;
  entries: TooltipEntry[];
}

export default function ChartTooltip({ label, entries }: ChartTooltipProps) {
  return (
    <div
      className="border border-rim px-3 py-2 text-xs"
      style={{ background: "#1c1710", minWidth: 140 }}
    >
      {label && (
        <p className="font-cinzel text-parchment-faint mb-2 text-xs tracking-wider">
          {label}
        </p>
      )}
      {entries.map((e) => (
        <div key={e.name} className="flex items-center gap-2 mb-1 last:mb-0">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: e.color }}
          />
          <span className="text-parchment-dim truncate" style={{ maxWidth: 120 }}>
            {e.name}
          </span>
          <span className="text-parchment font-mono ml-auto pl-3 font-bold">
            {e.value}
          </span>
        </div>
      ))}
    </div>
  );
}
