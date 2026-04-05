import type { ReactNode } from 'react';
import { cn } from '../Shared/cn';
import MetricTile from '../Shared/MetricTile';
import SectionCard from '../Shared/SectionCard';
import StatusPill from '../Shared/StatusPill';
import { formatDateTime } from '../Shared/format';
import type { WorkspaceMetric, WorkspaceSyncSnapshot, WorkspaceTab, WorkspaceTabId, WorkspaceUser } from './types';

interface WorkspaceNavRailProps {
  user: WorkspaceUser;
  sync: WorkspaceSyncSnapshot;
  tabs: WorkspaceTab[];
  activeTab: WorkspaceTabId;
  onTabChange: (tabId: WorkspaceTabId) => void;
  metrics?: WorkspaceMetric[];
  footer?: ReactNode;
  className?: string;
}

const syncToneMap = {
  synced: 'success',
  syncing: 'info',
  stale: 'warning',
  offline: 'danger',
} as const;

export default function WorkspaceNavRail({
  user,
  sync,
  tabs,
  activeTab,
  onTabChange,
  metrics = [],
  footer,
  className,
}: WorkspaceNavRailProps) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1', className)}>
      <SectionCard
        eyebrow="Workspace"
        title="Control center"
        description="Điều hướng giữa trợ lý, phòng họp và lịch sử booking."
        accent="indigo"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-semibold text-white">
            {user.initials || user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
            {user.role && <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{user.role}</p>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill
            label={sync.label}
            tone={syncToneMap[sync.state]}
            pulse={sync.state === 'syncing'}
          />
          {sync.source && <StatusPill label={sync.source} tone="neutral" />}
        </div>

        {sync.detail && <p className="mt-3 text-sm leading-6 text-slate-400">{sync.detail}</p>}
        {sync.lastSyncedAt && (
          <p className="mt-2 text-xs text-slate-500">Sync updated {formatDateTime(sync.lastSyncedAt)}</p>
        )}
      </SectionCard>

      <SectionCard eyebrow="Navigation" title="Views" accent="teal">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                  active
                    ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_16px_36px_rgba(8,145,178,0.18)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold',
                    active ? 'bg-cyan-400/20 text-cyan-100' : 'bg-white/5 text-slate-300'
                  )}
                >
                  {tab.icon || tab.label.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{tab.label}</p>
                    {tab.badge !== undefined && (
                      <span className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[11px] text-slate-300">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{tab.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {metrics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {metrics.map((metric) => (
            <MetricTile
              key={metric.label}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
            />
          ))}
        </div>
      )}

      {footer && <div className="mt-auto">{footer}</div>}
    </div>
  );
}
