import type { ReactNode } from 'react';
import { cn } from './cn';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/40 px-6 py-10 text-center backdrop-blur-sm',
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-200">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

