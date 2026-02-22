"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface Coach {
  id: number;
  name: string;
}

export default function NavCoachSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Coach[]>([]);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((term: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/coaches/search?q=${encodeURIComponent(term)}`);
        if (res.ok) {
          const data: Coach[] = await res.json();
          setResults(data);
          setOpen(data.length > 0);
        }
      } catch {
        /* silently ignore */
      }
    }, 300);
  }, []);

  const select = (coach: Coach) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    setMobileOpen(false);
    router.push(`/entrenador/${coach.id}`);
  };

  const dropdown = open && (
    <ul className="absolute right-0 top-full z-50 w-56 border border-rim bg-elevated mt-1 max-h-48 overflow-y-auto">
      {results.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onMouseDown={() => select(c)}
            className="w-full text-left px-3 py-2 font-barlow text-sm text-parchment hover:bg-surface hover:text-gold transition-colors"
          >
            {c.name}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Desktop: input inline */}
      <div className="relative hidden sm:block">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar entrenador…"
          className="w-44 bg-transparent border border-rim px-3 py-1 font-mono text-xs text-parchment placeholder:text-parchment-faint focus:outline-none focus:border-gold transition-colors"
        />
        {dropdown}
      </div>

      {/* Mobile: icono lupa → panel desplegable */}
      <div className="relative sm:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-parchment-dim hover:text-parchment transition-colors p-1"
          aria-label="Buscar entrenador"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 z-50 border border-rim bg-surface p-2">
            <input
              type="text"
              value={query}
              autoFocus
              onChange={(e) => {
                setQuery(e.target.value);
                search(e.target.value);
              }}
              onBlur={() =>
                setTimeout(() => {
                  setOpen(false);
                  setMobileOpen(false);
                }, 150)
              }
              placeholder="Buscar entrenador…"
              className="w-full bg-elevated border border-rim px-3 py-2 font-mono text-xs text-parchment placeholder:text-parchment-faint focus:outline-none focus:border-gold transition-colors"
            />
            {dropdown}
          </div>
        )}
      </div>
    </>
  );
}
