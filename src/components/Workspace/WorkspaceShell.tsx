import type { ReactNode } from 'react';
import { cn } from '../Shared/cn';
import StatusPill from '../Shared/StatusPill';
import { formatDateTime } from '../Shared/format';
import type { WorkspaceSyncSnapshot, WorkspaceUser } from './types';

interface WorkspaceShellProps {
  user: WorkspaceUser;
  sync: WorkspaceSyncSnapshot;
  title?: string;
  subtitle?: string;
  navigation: ReactNode;
  main: ReactNode;
  detail?: ReactNode;
  headerActions?: ReactNode;
  className?: string;
}

const syncToneMap = {
  synced: 'success',
  syncing: 'info',
  stale: 'warning',
  offline: 'danger',
} as const;

export default function WorkspaceShell({
  user,
  sync,
  title = 'Room workspace',
  subtitle = 'Tìm phòng, xem hồ sơ, theo dõi booking và trạng thái đồng bộ theo thời gian thực.',
  navigation,
  main,
  detail,
  headerActions,
  className,
}: WorkspaceShellProps) {
  return (
    <div className={cn('min-h-screen bg-[#07111f] text-slate-100', className)}>
      <div className="absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Smart Room Booking
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
                <StatusPill
                  label={sync.label}
                  tone={syncToneMap[sync.state]}
                  pulse={sync.state === 'syncing'}
                />
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-400">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {headerActions}
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-semibold text-white">
                  {user.initials || user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                  {user.role && <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{user.role}</p>}
                </div>
              </div>
              {sync.lastSyncedAt && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Last sync</p>
                  <p className="text-sm font-medium text-slate-200">{formatDateTime(sync.lastSyncedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
          <aside className="min-h-0 xl:sticky xl:top-4 xl:h-[calc(100vh-7.5rem)]">{navigation}</aside>

          <main className="min-h-0 xl:h-[calc(100vh-7.5rem)] xl:overflow-hidden">{main}</main>

          <aside className="min-h-0 xl:sticky xl:top-4 xl:h-[calc(100vh-7.5rem)]">{detail}</aside>
        </div>
      </div>
    </div>
  );
}

