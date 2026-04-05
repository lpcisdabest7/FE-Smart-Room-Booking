import { cn } from './cn';

interface MetricTileProps {
  label: string;
  value: string;
  detail?: string;
  tone?: 'slate' | 'indigo' | 'teal' | 'amber' | 'rose';
  className?: string;
}

const toneClasses: Record<NonNullable<MetricTileProps['tone']>, string> = {
  slate: 'from-slate-500/15 to-slate-400/5 text-slate-100 border-slate-200/10',
  indigo: 'from-indigo-500/15 to-sky-500/5 text-white border-indigo-200/10',
  teal: 'from-teal-500/15 to-cyan-500/5 text-white border-teal-200/10',
  amber: 'from-amber-500/15 to-orange-500/5 text-white border-amber-200/10',
  rose: 'from-rose-500/15 to-pink-500/5 text-white border-rose-200/10',
};

export default function MetricTile({
  label,
  value,
  detail,
  tone = 'slate',
  className,
}: MetricTileProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br p-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)]',
        toneClasses[tone],
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      {detail && <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>}
    </div>
  );
}

