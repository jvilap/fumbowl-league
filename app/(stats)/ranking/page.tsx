import { db } from "@/lib/db";
import { eloRatings, coaches } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { Table, type Column } from "@/components/ui/Table";
import Podium, { type RankingEntry } from "@/components/ranking/Podium";

export const dynamic = "force-dynamic";

function eloColor(rating: number): string {
  if (rating >= 1200) return "text-gold-bright";
  if (rating >= 1100) return "text-gold";
  if (rating >= 1000) return "text-parchment";
  return "text-parchment-dim";
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-ES", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const countUpScript = `(function(){function c(el){var t=parseInt(el.getAttribute('data-target'),10);var s=parseInt(el.getAttribute('data-start')||'0',10);var d=800;var st=null;function step(ts){if(!st)st=ts;var p=Math.min((ts-st)/d,1);var e=1-(1-p)*(1-p);el.textContent=Math.round(s+(t-s)*e).toString();if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}function init(){document.querySelectorAll('[data-countup]').forEach(c);}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}})();`;

export default async function RankingPage() {
  const results = await db
    .select({
      coachId: coaches.id,
      name: coaches.name,
      rating: eloRatings.rating,
      wins: eloRatings.wins,
      ties: eloRatings.ties,
      losses: eloRatings.losses,
      gamesPlayed: eloRatings.gamesPlayed,
      lastMatchDate: eloRatings.lastMatchDate,
    })
    .from(eloRatings)
    .innerJoin(coaches, eq(eloRatings.coachId, coaches.id))
    .orderBy(desc(eloRatings.rating));

  const rankings: RankingEntry[] = results.map((r) => ({
    coachId: r.coachId,
    name: r.name,
    rating: Math.round(r.rating),
    wins: r.wins,
    ties: r.ties,
    losses: r.losses,
    gamesPlayed: r.gamesPlayed,
    lastMatchDate: r.lastMatchDate,
  }));

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const leader = top3[0];
  const startRank = 4;

  const columns: Column<RankingEntry>[] = [
    {
      key: "rank",
      header: "#",
      cell: (_, index) => (
        <span className="font-mono text-sm text-parchment-faint">
          {startRank + index}
        </span>
      ),
      align: "right",
    },
    {
      key: "name",
      header: "Entrenador",
      cell: (row) => (
        <span className="font-barlow font-semibold text-base text-parchment">
          {row.name}
        </span>
      ),
      align: "left",
    },
    {
      key: "elo",
      header: "ELO",
      cell: (row) => (
        <span className={`font-mono font-bold text-sm ${eloColor(row.rating)}`}>
          {row.rating}
        </span>
      ),
      align: "right",
    },
    {
      key: "pj",
      header: "PJ",
      cell: (row) => (
        <span className="font-mono text-sm text-parchment-dim">
          {row.gamesPlayed}
        </span>
      ),
      align: "right",
    },
    {
      key: "wins",
      header: "V",
      cell: (row) => (
        <span className="font-mono text-sm text-win">{row.wins}</span>
      ),
      align: "right",
    },
    {
      key: "ties",
      header: "E",
      cell: (row) => (
        <span className="font-mono text-sm text-parchment-faint">
          {row.ties}
        </span>
      ),
      align: "right",
    },
    {
      key: "losses",
      header: "D",
      cell: (row) => (
        <span className="font-mono text-sm text-loss">{row.losses}</span>
      ),
      align: "right",
    },
    {
      key: "last",
      header: "Último",
      cell: (row) => (
        <span className="font-mono text-xs text-parchment-faint">
          {formatDate(row.lastMatchDate)}
        </span>
      ),
      align: "right",
    },
  ];

  return (
    <>
      <main>
        <Podium top3={top3} />

        <div className="max-w-7xl mx-auto px-6 pb-16">
          <PageHeader
            title="RANKING ELO"
            subtitle="Clasificación global de entrenadores por rating acumulado"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Líder" value={leader?.name ?? "—"} />
            <StatCard
              label="Rating Máximo"
              value={leader?.rating ?? 0}
              countUp
              start={1000}
            />
            <StatCard
              label="Entrenadores"
              value={rankings.length}
              countUp
              start={0}
            />
          </div>

          <div className="border border-rim">
            <Table
              columns={columns}
              rows={rest}
              rowKey={(row) => row.coachId}
            />
          </div>

          {rest.length === 0 && (
            <p className="text-center text-parchment-faint font-mono text-sm py-8">
              No hay datos disponibles
            </p>
          )}

          <p className="mt-8 text-center font-mono text-xs text-parchment-faint">
            {rankings.length} entrenadores · ELO inicial 1000 · K=32
          </p>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{ __html: countUpScript }} />
    </>
  );
}
