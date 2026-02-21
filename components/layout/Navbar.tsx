import Link from "next/link";

const navLinks = [
  { href: "/", label: "Divisiones" },
  { href: "/ranking", label: "Ranking ELO" },
  { href: "/elo", label: "Evolución ELO" },
  { href: "/razas", label: "Razas" },
  { href: "/h2h", label: "H2H" },
  { href: "/partidas", label: "Partidas" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-rim bg-surface/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        <Link
          href="/"
          className="font-cinzel font-bold text-lg tracking-widest uppercase text-gold-bright hover:text-gold transition-colors"
        >
          Fumbowl
          <span className="text-parchment-dim font-normal"> League</span>
        </Link>

        <ul className="flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-barlow text-sm font-semibold tracking-wider uppercase text-parchment-dim hover:text-parchment transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
