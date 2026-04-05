import type { ReactNode } from 'react';
import { cn } from './cn';

interface SectionCardProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: 'indigo' | 'teal' | 'amber' | 'rose' | 'slate';
}

const accentClasses: Record<NonNullable<SectionCardProps['accent']>, string> = {
  indigo: 'from-indigo-500/20 via-transparent to-sky-500/10',
  teal: 'from-teal-500/20 via-transparent to-cyan-500/10',
  amber: 'from-amber-500/20 via-transparent to-orange-500/10',
  rose: 'from-rose-500/20 via-transparent to-pink-500/10',
  slate: 'from-slate-400/20 via-transparent to-slate-500/10',
};

export default function SectionCard({
  title,
  eyebrow,
  description,
  action,
  children,
  className,
  accent = 'slate',
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.32)] backdrop-blur-xl',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70',
          accentClasses[accent]
        )}
      />
      <div className="relative flex h-full flex-col gap-4">
        {(title || eyebrow || description || action) && (
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {eyebrow}
                </p>
              )}
              {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
              {description && <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}
            </div>
            {action}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

