import type { ReactNode } from 'react';
import { cn } from './cn';

export type StatusTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'live';

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
  icon?: ReactNode;
  pulse?: boolean;
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  accent: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-rose-100 text-rose-700 border-rose-200',
  info: 'bg-sky-100 text-sky-700 border-sky-200',
  live: 'bg-teal-100 text-teal-800 border-teal-200',
};

export default function StatusPill({
  label,
  tone = 'neutral',
  icon,
  pulse = false,
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        toneClasses[tone],
        className
      )}
    >
      <span
        className={cn(
          'inline-flex h-2 w-2 rounded-full',
          tone === 'success' || tone === 'live' ? 'bg-emerald-500' : '',
          tone === 'warning' ? 'bg-amber-500' : '',
          tone === 'danger' ? 'bg-rose-500' : '',
          tone === 'info' ? 'bg-sky-500' : '',
          tone === 'accent' ? 'bg-indigo-500' : '',
          tone === 'neutral' ? 'bg-slate-400' : '',
          pulse && 'animate-pulse'
        )}
      />
      {icon}
      <span>{label}</span>
    </span>
  );
}

