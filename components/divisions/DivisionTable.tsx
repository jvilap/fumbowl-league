import Link from "next/link";
import FormBadges from "./FormBadges";

export interface DivisionTeamRow {
  id: number;
  coachId: number;
  name: string;
  coachName: string;
  rosterName: string | null;
  recordGames: number;
  recordWins: number;
  recordTies: number;
  recordLosses: number;
  recordTdFor: number;
  recordTdAgainst: number;
  form: string | null;
}

interface DivisionTableProps {
  name: string;
  tournamentId: number;
  teams: DivisionTeamRow[];
}

export default function DivisionTable({ name, tournamentId, teams }: DivisionTableProps) {
  return (
    <div className="border border-rim bg-surface">
      <div className="px-4 py-3 border-b border-rim flex items-center justify-between">
        <h2 className="font-cinzel text-sm font-bold uppercase tracking-widest text-gold">
          {name}
        </h2>
        <Link
          href={`/torneo/${tournamentId}`}
          className="font-mono text-xs text-parchment-faint hover:text-gold transition-colors"
        >
          Ver torneo →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-rim">
              <th className="px-3 py-2 text-left font-cinzel text-xs uppercase tracking-wider text-parchment-faint w-6">#</th>
              <th className="px-3 py-2 text-left font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Equipo</th>
              <th className="px-3 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">PJ</th>
              <th className="px-3 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">V</th>
              <th className="px-3 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">E</th>
              <th className="px-3 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">D</th>
              <th className="px-3 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">GF/GC</th>
              <th className="px-3 py-2 text-left font-cinzel text-xs uppercase tracking-wider text-parchment-faint hidden sm:table-cell">Forma</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => (
              <tr
                key={team.id}
                className="border-b border-rim last:border-0 hover:bg-elevated transition-colors duration-100"
              >
                <td className="px-3 py-2 font-mono text-xs text-parchment-faint text-right">
                  {i + 1}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <Link
                      href={`/equipo/${team.id}`}
                      className="font-barlow font-semibold text-sm text-parchment hover:text-gold transition-colors leading-tight"
                    >
                      {team.name}
                    </Link>
                    <Link
                      href={`/entrenador/${team.coachId}`}
                      className="font-mono text-xs text-parchment-faint hover:text-parchment-dim transition-colors"
                    >
                      {team.coachName}
                      {team.rosterName && (
                        <span className="text-parchment-faint"> · {team.rosterName}</span>
                      )}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-parchment-dim text-right">
                  {team.recordGames}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-win text-right font-bold">
                  {team.recordWins}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-parchment-faint text-right">
                  {team.recordTies}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-loss text-right">
                  {team.recordLosses}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-parchment-dim text-right whitespace-nowrap">
                  {team.recordTdFor}/{team.recordTdAgainst}
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                  <FormBadges form={team.form} />
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center font-mono text-xs text-parchment-faint">
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
