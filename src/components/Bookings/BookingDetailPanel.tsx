import type { WorkspaceBooking, WorkspaceRoom } from '../Workspace';
import EmptyState from '../Shared/EmptyState';
import MetricTile from '../Shared/MetricTile';
import SectionCard from '../Shared/SectionCard';
import StatusPill from '../Shared/StatusPill';
import { cn } from '../Shared/cn';
import { formatDateTime, formatRelativeTime, formatTimeRange } from '../Shared/format';

interface BookingDetailPanelProps {
  booking: WorkspaceBooking | null;
  room?: WorkspaceRoom | null;
  onOpenRoom?: (roomId: string) => void;
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

export default function BookingDetailPanel({
  booking,
  room,
  onOpenRoom,
  className,
}: BookingDetailPanelProps) {
  if (!booking) {
    return (
      <SectionCard
        eyebrow="Booking detail"
        title="Chọn một booking"
        description="Chi tiết booking, trạng thái sync và lịch sử cập nhật sẽ hiện ở đây."
        accent="amber"
        className={cn('h-full', className)}
      >
        <EmptyState
          title="Chưa có booking được chọn"
          description="Click một booking item để xem chi tiết, trạng thái và lịch sử thay đổi."
        />
      </SectionCard>
    );
  }

  const timeline =
    booking.history && booking.history.length > 0
      ? booking.history
      : [
          {
            at: booking.createdAt || booking.startAt,
            label: 'Created',
            detail: 'Booking record was created.',
          },
          {
            at: booking.updatedAt || booking.createdAt || booking.startAt,
            label: 'Last updated',
            detail: 'Latest booking state is shown here.',
          },
        ];

  return (
    <SectionCard
      eyebrow="Booking detail"
      title={booking.title}
      description={booking.roomName}
      accent="amber"
      className={cn('h-full', className)}
      action={<StatusPill label={booking.status} tone={bookingTone(booking.status)} />}
    >
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricTile
            label="Time"
            value={formatTimeRange(booking.startAt, booking.endAt)}
            detail={formatRelativeTime(booking.startAt)}
            tone="indigo"
          />
          <MetricTile
            label="Organizer"
            value={booking.organizer || 'Unknown'}
            detail={booking.source || 'sync'}
            tone="teal"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
          <SectionCard eyebrow="Summary" title="Booking info" accent="rose" className="p-4">
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                <span className="text-slate-500">Room:</span> {booking.roomName}
              </p>
              <p>
                <span className="text-slate-500">Location:</span> {booking.location || booking.roomName}
              </p>
              <p>
                <span className="text-slate-500">Created:</span> {formatDateTime(booking.createdAt)}
              </p>
              <p>
                <span className="text-slate-500">Updated:</span> {formatDateTime(booking.updatedAt)}
              </p>
              {booking.confirmationCode && (
                <p>
                  <span className="text-slate-500">Reference:</span> {booking.confirmationCode}
                </p>
              )}
              {booking.notes && (
                <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-300">
                  {booking.notes}
                </p>
              )}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Actions" title="Quick view" accent="teal" className="p-4">
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Status</p>
                <p className="mt-2 text-sm font-semibold text-white">{booking.status}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Source</p>
                <p className="mt-2 text-sm font-semibold text-white">{booking.source || 'sync'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Participants</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {booking.participants ? `${booking.participants} people` : 'Not provided'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenRoom?.(booking.roomId)}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                Mở room profile
              </button>
            </div>
          </SectionCard>
        </div>

        {room && (
          <SectionCard eyebrow="Room context" title={room.name} accent="indigo" className="p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricTile label="Capacity" value={`${room.capacity}`} tone="indigo" />
              <MetricTile label="Floor" value={room.floor || 'N/A'} tone="teal" />
              <MetricTile label="Status" value={room.status || 'unknown'} tone="amber" />
            </div>
          </SectionCard>
        )}

        <SectionCard eyebrow="Timeline" title="History" accent="slate" className="p-4">
          <div className="space-y-3">
            {timeline.map((entry) => (
              <div
                key={`${entry.label}-${entry.at}`}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mt-1 h-3 w-3 rounded-full bg-cyan-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{entry.label}</p>
                  <p className="text-sm text-slate-400">{entry.detail}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(entry.at)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
          {booking.status === 'pending'
            ? 'Booking đang chờ đồng bộ xác nhận.'
            : booking.status === 'confirmed'
            ? 'Booking đã được xác nhận trong hệ thống.'
            : booking.status === 'cancelled'
            ? 'Booking đã bị hủy.'
            : booking.status === 'modified'
            ? 'Booking vừa được cập nhật.'
            : 'Booking đang gặp lỗi đồng bộ.'}
        </div>
      </div>
    </SectionCard>
  );
}
