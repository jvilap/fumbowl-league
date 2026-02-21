interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <header className="px-6 py-8 text-center">
      <div className="flex items-center justify-center gap-4 mb-3">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent to-gold-dim max-w-24" />
        <span className="text-gold text-sm font-mono">✦</span>
        <span className="flex-1 h-px bg-gradient-to-l from-transparent to-gold-dim max-w-24" />
      </div>
      <h1 className="font-cinzel text-4xl font-bold tracking-widest uppercase text-parchment">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-parchment-dim font-barlow text-sm tracking-wide">
          {subtitle}
        </p>
      )}
      <div className="flex items-center justify-center gap-4 mt-3">
        <span className="flex-1 h-px bg-gradient-to-r from-transparent to-gold-dim max-w-24" />
        <span className="text-gold text-sm font-mono">✦</span>
        <span className="flex-1 h-px bg-gradient-to-l from-transparent to-gold-dim max-w-24" />
      </div>
    </header>
  );
}
