import type { WorkspaceBooking } from '../Workspace';
import { cn } from '../Shared/cn';
import { formatDateOnly, formatDateTime, formatRelativeTime, formatTimeRange } from '../Shared/format';
import SectionCard from '../Shared/SectionCard';
import StatusPill from '../Shared/StatusPill';

interface BookingCardProps {
  booking: WorkspaceBooking;
  active?: boolean;
  onSelect?: (booking: WorkspaceBooking) => void;
  className?: string;
}

const bookingTone = (status: WorkspaceBooking['status']) =>
  status === 'confirmed'
    ? 'success'
    : status === 'pending'
    ? 'warning'
    : status === 'cancelled'
    ? 'danger'
    : 'info';

export default function BookingCard({
  booking,
  active = false,
  onSelect,
  className,
}: BookingCardProps) {
  return (
    <SectionCard
      accent="indigo"
      className={cn(
        'transition-all duration-200',
        active && 'ring-2 ring-cyan-300/40',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSelect?.(booking)}
        className="block w-full text-left"
      >
        <div className="space-y-4 rounded-[1.35rem] border border-white/10 bg-slate-950/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {formatDateOnly(booking.startAt)}
              </p>
              <h3 className="mt-1 truncate text-lg font-semibold tracking-tight text-white">
                {booking.title}
              </h3>
              <p className="mt-2 text-sm text-slate-400">{booking.roomName}</p>
            </div>
            <StatusPill label={booking.status} tone={bookingTone(booking.status)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Time</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formatTimeRange(booking.startAt, booking.endAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Organizer</p>
              <p className="mt-2 text-sm font-semibold text-white">{booking.organizer || 'Unknown'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Source</p>
              <p className="mt-2 text-sm font-semibold text-white">{booking.source || 'sync'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{booking.location || booking.roomName}</span>
            <span>•</span>
            <span>{formatRelativeTime(booking.startAt)}</span>
            {booking.participants ? (
              <>
                <span>•</span>
                <span>{booking.participants} people</span>
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {booking.confirmationCode
                ? `Ref ${booking.confirmationCode}`
                : `Updated ${formatDateTime(booking.updatedAt)}`}
            </p>
            <span className="text-xs font-medium text-cyan-300">Xem chi tiết</span>
          </div>
        </div>
      </button>
    </SectionCard>
  );
}

