export interface RankingEntry {
  coachId: number;
  name: string;
  rating: number;
  wins: number;
  ties: number;
  losses: number;
  gamesPlayed: number;
  lastMatchDate: Date | null;
}

interface PodiumProps {
  top3: RankingEntry[];
}

function PodiumBlock({
  entry,
  rank,
  champion,
}: {
  entry: RankingEntry;
  rank: number;
  champion?: boolean;
}) {
  const record = `${entry.wins}V · ${entry.ties}E · ${entry.losses}D`;

  if (champion) {
    return (
      <div
        className="relative flex flex-col items-center text-center px-8 py-10 border border-gold bg-gradient-to-b from-elevated to-surface"
        style={{ animation: "pulseGold 3s ease-in-out infinite" }}
      >
        <span className="text-gold-bright text-xl mb-3 select-none">✦</span>
        <p className="font-cinzel text-xs uppercase tracking-widest text-gold mb-4">
          Campeón
        </p>
        <h2
          className="font-cinzel font-bold text-4xl text-parchment leading-tight mb-2"
          title={entry.name}
        >
          {entry.name}
        </h2>
        <div
          className="font-mono text-6xl font-bold text-gold-bright my-4"
          data-countup="true"
          data-target={entry.rating.toString()}
          data-start="1000"
        >
          {entry.rating}
        </div>
        <p className="font-barlow text-sm text-parchment-dim tracking-wide">
          {record}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center px-6 py-7 border border-rim bg-surface">
      <span className="font-cinzel text-xs text-parchment-faint mb-3">
        #{rank}
      </span>
      <h3
        className="font-cinzel font-bold text-xl text-parchment leading-tight mb-2"
        title={entry.name}
      >
        {entry.name}
      </h3>
      <div
        className="font-mono text-3xl font-bold text-gold my-2"
        data-countup="true"
        data-target={entry.rating.toString()}
        data-start="1000"
      >
        {entry.rating}
      </div>
      <p className="font-barlow text-xs text-parchment-faint tracking-wide">
        {record}
      </p>
    </div>
  );
}

export default function Podium({ top3 }: PodiumProps) {
  const [first, second, third] = top3;

  return (
    <section className="max-w-7xl mx-auto px-6 pt-10 pb-6">
      <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 items-end">
        {second ? (
          <PodiumBlock entry={second} rank={2} />
        ) : (
          <div />
        )}
        {first && <PodiumBlock entry={first} rank={1} champion />}
        {third ? (
          <PodiumBlock entry={third} rank={3} />
        ) : (
          <div />
        )}
      </div>
    </section>
  );
}
