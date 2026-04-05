import type { CSSProperties } from 'react';
import type { WorkspaceRoom } from '../Workspace';
import { cn } from '../Shared/cn';
import { formatRelativeTime, formatTimeRange } from '../Shared/format';
import SectionCard from '../Shared/SectionCard';
import StatusPill, { type StatusTone } from '../Shared/StatusPill';

interface RoomCardProps {
  room: WorkspaceRoom;
  active?: boolean;
  onSelect?: (room: WorkspaceRoom) => void;
  onBook?: (room: WorkspaceRoom) => void;
  className?: string;
}

const statusToneMap: Record<NonNullable<WorkspaceRoom['status']>, StatusTone> = {
  available: 'success',
  busy: 'danger',
  soon: 'warning',
  unknown: 'neutral',
};

export default function RoomCard({
  room,
  active = false,
  onSelect,
  onBook,
  className,
}: RoomCardProps) {
  const accent = room.color || 'rgba(14, 165, 233, 0.22)';
  const nextBooking = room.nextBooking;

  const heroStyle: CSSProperties = room.imageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.20), rgba(2,6,23,0.92)), url(${room.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.84))',
      };

  return (
    <SectionCard
      accent="indigo"
      className={cn(
        'transition-all duration-200',
        active && 'ring-2 ring-cyan-300/40',
        className
      )}
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => onSelect?.(room)}
          className="group block w-full text-left"
        >
          <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950/80 p-4" style={heroStyle}>
            <div
              className="pointer-events-none absolute inset-0 rounded-[1.35rem] opacity-80"
              style={{ boxShadow: `inset 0 0 0 1px ${accent}` }}
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Room {room.id}
                </p>
                <h3 className="mt-1 truncate text-xl font-semibold tracking-tight text-white">
                  {room.name}
                </h3>
                {room.description && (
                  <p className="mt-2 max-h-12 max-w-xl overflow-hidden text-sm leading-6 text-slate-300">
                    {room.description}
                  </p>
                )}
              </div>
              <StatusPill
                label={room.statusLabel || room.status || 'unknown'}
                tone={statusToneMap[room.status || 'unknown']}
                pulse={room.status === 'busy'}
              />
            </div>

            <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Capacity</p>
                <p className="mt-2 text-base font-semibold text-white">{room.capacity} people</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Floor</p>
                <p className="mt-2 text-base font-semibold text-white">{room.floor || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Occupancy</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {typeof room.occupancyRate === 'number' ? `${Math.round(room.occupancyRate)}%` : 'Live'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Status</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {room.statusLabel || 'Available'}
                </p>
              </div>
            </div>
          </div>
        </button>

        {room.equipment && room.equipment.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {room.equipment.slice(0, 6).map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {nextBooking && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Next booking
                </p>
                <h4 className="mt-1 text-sm font-semibold text-white">{nextBooking.title}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  {formatTimeRange(nextBooking.startAt, nextBooking.endAt)}
                </p>
              </div>
              <StatusPill
                label={nextBooking.status}
                tone={
                  nextBooking.status === 'confirmed'
                    ? 'success'
                    : nextBooking.status === 'pending'
                    ? 'warning'
                    : nextBooking.status === 'cancelled'
                    ? 'danger'
                    : 'info'
                }
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {nextBooking.organizer ? `by ${nextBooking.organizer} · ` : ''}
              {formatRelativeTime(nextBooking.startAt)}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelect?.(room)}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
          >
            Xem hồ sơ phòng
          </button>
          <button
            type="button"
            onClick={() => onBook?.(room)}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_28px_rgba(14,165,233,0.22)] transition hover:brightness-105"
          >
            Đặt phòng này
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
