"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface Coach {
  id: number;
  name: string;
}

interface CoachSearchProps {
  label: string;
  paramKey: "a" | "b";
  otherParam: string | null;
  otherParamKey: "a" | "b";
  defaultValue?: string;
}

export default function CoachSearch({
  label,
  paramKey,
  otherParam,
  otherParamKey,
  defaultValue = "",
}: CoachSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<Coach[]>([]);
  const [open, setOpen] = useState(false);
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
        // silently ignore
      }
    }, 300);
  }, []);

  const select = (coach: Coach) => {
    setQuery(coach.name);
    setOpen(false);
    setResults([]);
    const params = new URLSearchParams();
    params.set(paramKey, String(coach.id));
    if (otherParam) params.set(otherParamKey, otherParam);
    router.push(`/h2h?${params.toString()}`);
  };

  return (
    <div className="relative flex-1">
      <label className="block font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-2">
        {label}
      </label>
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
        className="w-full bg-surface border border-rim px-3 py-2 font-mono text-sm text-parchment placeholder:text-parchment-faint focus:outline-none focus:border-gold transition-colors"
      />
      {open && (
        <ul className="absolute z-20 w-full border border-rim bg-elevated mt-px max-h-48 overflow-y-auto">
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
      )}
    </div>
  );
}
