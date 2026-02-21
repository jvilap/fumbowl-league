import { db } from "@/lib/db";
import { matches, teams, tournaments, seasons } from "@/lib/db/schema";
import { eq, desc, and, sql, count, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export const revalidate = 1800;

const PAGE_SIZE = 50;

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-ES", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface Props {
  searchParams: Promise<{ page?: string; season?: string; tipo?: string }>;
}

export default async function PartidasPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? "0", 10) || 0);
  const seasonFilter = params.season ?? "";
  const tipoFilter = params.tipo ?? "";

  // Available seasons for filter
  const allSeasons = await db
    .select({ id: seasons.id, label: seasons.label })
    .from(seasons)
    .orderBy(desc(seasons.id));

  // Build where clause
  const conditions = [];
  if (seasonFilter) {
    // Filter by season via tournament
    conditions.push(
      sql`${tournaments.seasonId} = ${seasonFilter}`
    );
  }
  if (tipoFilter) {
    conditions.push(eq(tournaments.type, tipoFilter));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total
  const [{ total }] = await db
    .select({ total: count() })
    .from(matches)
    .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
    .where(whereClause);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));

  // Fetch page
  const team1 = alias(teams, "team1");
  const team2 = alias(teams, "team2");

  const rows = await db
    .select({
      id: matches.id,
      date: matches.date,
      tournamentId: matches.tournamentId,
      tournamentName: tournaments.name,
      tournamentType: tournaments.type,
      team1Name: team1.name,
      team1Score: matches.team1Score,
      team2Name: team2.name,
      team2Score: matches.team2Score,
      winnerCoachId: matches.winnerCoachId,
    })
    .from(matches)
    .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
    .leftJoin(team1, eq(matches.team1Id, team1.id))
    .leftJoin(team2, eq(matches.team2Id, team2.id))
    .where(whereClause)
    .orderBy(desc(matches.date))
    .limit(PAGE_SIZE)
    .offset(safePage * PAGE_SIZE);

  function buildUrl(overrides: { page?: number; season?: string; tipo?: string }) {
    const p = new URLSearchParams();
    const s = overrides.season !== undefined ? overrides.season : seasonFilter;
    const t = overrides.tipo !== undefined ? overrides.tipo : tipoFilter;
    const pg = overrides.page !== undefined ? overrides.page : safePage;
    if (s) p.set("season", s);
    if (t) p.set("tipo", t);
    if (pg > 0) p.set("page", String(pg));
    const qs = p.toString();
    return `/partidas${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="max-w-7xl mx-auto px-6 pb-16">
      <PageHeader
        title="HISTORIAL DE PARTIDAS"
        subtitle={`${total.toLocaleString("es-ES")} partidas registradas`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Temporada:</span>
          <Link
            href={buildUrl({ season: "", page: 0 })}
            className={`font-mono text-xs px-3 py-1 border transition-colors ${
              !seasonFilter
                ? "border-gold text-gold"
                : "border-rim text-parchment-dim hover:border-parchment-dim"
            }`}
          >
            Todas
          </Link>
          {allSeasons.map((s) => (
            <Link
              key={s.id}
              href={buildUrl({ season: s.id, page: 0 })}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                seasonFilter === s.id
                  ? "border-gold text-gold"
                  : "border-rim text-parchment-dim hover:border-parchment-dim"
              }`}
            >
              {s.id}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Tipo:</span>
          {["", "Swiss", "RoundRobin", "Knockout"].map((t) => (
            <Link
              key={t}
              href={buildUrl({ tipo: t, page: 0 })}
              className={`font-mono text-xs px-3 py-1 border transition-colors ${
                tipoFilter === t
                  ? "border-gold text-gold"
                  : "border-rim text-parchment-dim hover:border-parchment-dim"
              }`}
            >
              {t || "Todos"}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-rim overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-rim">
              <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Fecha</th>
              <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint hidden md:table-cell">Torneo</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Local</th>
              <th className="px-4 py-3 text-center font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Resultado</th>
              <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Visitante</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-mono text-sm text-parchment-faint">
                  No hay partidas
                </td>
              </tr>
            )}
            {rows.map((m) => {
              const isDraw = m.winnerCoachId === null;
              return (
                <tr
                  key={m.id}
                  className="border-b border-rim last:border-0 hover:bg-elevated transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-xs text-parchment-faint whitespace-nowrap">
                    {formatDate(m.date)}
                  </td>
                  <td className="px-4 py-2 font-barlow text-xs text-parchment-dim hidden md:table-cell">
                    <Link
                      href={`/torneo/${m.tournamentId}`}
                      className="hover:text-parchment transition-colors"
                    >
                      {m.tournamentName ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-barlow text-sm text-parchment text-right">
                    {m.team1Name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`font-mono text-sm font-bold ${isDraw ? "text-parchment-dim" : "text-gold"}`}
                    >
                      {m.team1Score ?? "?"} – {m.team2Score ?? "?"}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-barlow text-sm text-parchment">
                    {m.team2Name ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-parchment-faint">
            Página {safePage + 1} de {totalPages} · {total} partidas
          </p>
          <div className="flex gap-2">
            {safePage > 0 && (
              <Link
                href={buildUrl({ page: safePage - 1 })}
                className="font-mono text-xs px-3 py-1 border border-rim text-parchment-dim hover:border-parchment-dim hover:text-parchment transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {safePage < totalPages - 1 && (
              <Link
                href={buildUrl({ page: safePage + 1 })}
                className="font-mono text-xs px-3 py-1 border border-rim text-parchment-dim hover:border-parchment-dim hover:text-parchment transition-colors"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
