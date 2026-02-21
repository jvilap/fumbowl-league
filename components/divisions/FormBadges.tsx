interface FormBadgesProps {
  form: string | null;
}

const config = {
  W: { label: "V", bg: "bg-win/20", text: "text-win", border: "border-win/40" },
  D: { label: "E", bg: "bg-parchment-faint/20", text: "text-parchment-dim", border: "border-rim" },
  L: { label: "D", bg: "bg-loss/20", text: "text-loss", border: "border-loss/40" },
} as const;

export default function FormBadges({ form }: FormBadgesProps) {
  if (!form) return <span className="text-parchment-faint font-mono text-xs">—</span>;

  const chars = form.slice(0, 5).split("").reverse();

  return (
    <div className="flex gap-1">
      {chars.map((ch, i) => {
        const cfg = config[ch as keyof typeof config];
        if (!cfg) return null;
        return (
          <span
            key={i}
            className={`inline-flex items-center justify-center w-5 h-5 text-xs font-mono font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}
