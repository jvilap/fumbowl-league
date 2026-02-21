interface StatCardProps {
  label: string;
  value: string | number;
  countUp?: boolean;
  start?: number;
}

export default function StatCard({
  label,
  value,
  countUp = false,
  start = 0,
}: StatCardProps) {
  const isNumeric = typeof value === "number";
  const showCountUp = countUp && isNumeric;

  return (
    <div className="bg-surface border border-rim p-5">
      <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-2">
        {label}
      </p>
      <p
        className="font-mono text-3xl font-bold text-parchment leading-none"
        data-countup={showCountUp ? "true" : undefined}
        data-target={showCountUp ? (value as number).toString() : undefined}
        data-start={showCountUp ? start.toString() : undefined}
        suppressHydrationWarning
      >
        {value}
      </p>
    </div>
  );
}
