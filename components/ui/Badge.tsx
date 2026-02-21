interface BadgeProps {
  type: "win" | "draw" | "loss";
}

const config = {
  win: { label: "V", bg: "bg-win", text: "text-base" },
  draw: { label: "E", bg: "bg-parchment-faint", text: "text-parchment-dim" },
  loss: { label: "D", bg: "bg-loss", text: "text-base" },
};

export default function Badge({ type }: BadgeProps) {
  const { label, bg, text } = config[type];
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-xs font-mono font-bold tracking-wider ${bg} ${text}`}
    >
      {label}
    </span>
  );
}
