import type { WorkspaceBooking, WorkspaceRoom } from '../Workspace';
import EmptyState from '../Shared/EmptyState';
import MetricTile from '../Shared/MetricTile';
import SectionCard from '../Shared/SectionCard';
import StatusPill from '../Shared/StatusPill';
import { cn } from '../Shared/cn';
import { formatDateOnly, formatDateTime, formatRelativeTime, formatTimeRange } from '../Shared/format';

interface RoomProfilePanelProps {
  room: WorkspaceRoom | null;
  onBookRoom?: (room: WorkspaceRoom) => void;
  onSelectBooking?: (bookingId: string) => void;
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

export default function RoomProfilePanel({
  room,
  onBookRoom,
  onSelectBooking,
  className,
}: RoomProfilePanelProps) {
  if (!room) {
    return (
      <SectionCard
        eyebrow="Room profile"
        title="Chọn một phòng"
        description="Hồ sơ phòng sẽ hiện ở đây với mô tả, thiết bị, booking kế tiếp và trạng thái live."
        accent="indigo"
        className={cn('h-full', className)}
      >
        <EmptyState
          title="Chưa có phòng được chọn"
          description="Click một room card để mở hồ sơ phòng ở panel bên phải."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      eyebrow="Room profile"
      title={room.name}
      description={room.description || 'Hồ sơ phòng với dữ liệu live, equipment và lịch sử booking.'}
      accent="indigo"
      className={cn('h-full', className)}
      action={
        <StatusPill
          label={room.statusLabel || room.status || 'unknown'}
          tone={room.status === 'busy' ? 'danger' : room.status === 'soon' ? 'warning' : 'success'}
          pulse={room.status === 'busy'}
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
        <div
          className="relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-slate-950/80 p-5"
          style={
            room.imageUrl
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.18), rgba(2,6,23,0.88)), url(${room.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Capacity" value={`${room.capacity}`} detail="people" tone="indigo" />
            <MetricTile label="Floor" value={room.floor || 'N/A'} detail="location" tone="teal" />
            <MetricTile
              label="Occupancy"
              value={typeof room.occupancyRate === 'number' ? `${Math.round(room.occupancyRate)}%` : 'Live'}
              detail={room.statusLabel || 'current'}
              tone="amber"
            />
            <MetricTile
              label="Availability"
              value={room.status || 'unknown'}
              detail={room.nextBooking ? 'next booking tracked' : 'no upcoming booking'}
              tone="rose"
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {room.equipment && room.equipment.length > 0 && (
              <SectionCard eyebrow="Equipment" title="Thiết bị phòng" accent="teal" className="p-4">
                <div className="flex flex-wrap gap-2">
                  {room.equipment.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {room.features && room.features.length > 0 && (
              <SectionCard eyebrow="Highlights" title="Điểm nổi bật" accent="amber" className="p-4">
                <div className="space-y-3">
                  {room.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-white">{feature.label}</p>
                      {feature.detail && <p className="mt-1 text-sm text-slate-400">{feature.detail}</p>}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {room.notes && room.notes.length > 0 && (
              <SectionCard eyebrow="Notes" title="Ghi chú" accent="slate" className="p-4">
                <ul className="space-y-2">
                  {room.notes.map((note) => (
                    <li key={note} className="flex gap-3 text-sm text-slate-300">
                      <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>

          <div className="space-y-4">
            <SectionCard eyebrow="Next booking" title="Lịch kế tiếp" accent="rose" className="p-4">
              {room.nextBooking ? (
                <button
                  type="button"
                  onClick={() => onSelectBooking?.(room.nextBooking!.id)}
                  className="block w-full rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-left transition hover:border-white/20 hover:bg-slate-950/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        {formatDateOnly(room.nextBooking.startAt)}
                      </p>
                      <h4 className="mt-1 text-sm font-semibold text-white">{room.nextBooking.title}</h4>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatTimeRange(room.nextBooking.startAt, room.nextBooking.endAt)}
                      </p>
                    </div>
                    <StatusPill label={room.nextBooking.status} tone={bookingTone(room.nextBooking.status)} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {room.nextBooking.organizer ? `${room.nextBooking.organizer} · ` : ''}
                    {formatRelativeTime(room.nextBooking.startAt)}
                  </p>
                </button>
              ) : (
                <EmptyState
                  title="Không có booking kế tiếp"
                  description="Room này hiện chưa có booking nào ở đuôi lịch."
                />
              )}
            </SectionCard>

            {room.upcomingBookings && room.upcomingBookings.length > 0 && (
              <SectionCard eyebrow="Upcoming" title="Lịch sắp tới" accent="indigo" className="p-4">
                <div className="space-y-3">
                  {room.upcomingBookings.slice(0, 4).map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => onSelectBooking?.(booking.id)}
                      className="block w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{booking.title}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {formatTimeRange(booking.startAt, booking.endAt)}
                          </p>
                        </div>
                        <StatusPill label={booking.status} tone={bookingTone(booking.status)} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {booking.organizer ? `${booking.organizer} · ` : ''}
                        {formatRelativeTime(booking.startAt)}
                      </p>
                    </button>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onBookRoom?.(room)}
            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
          >
            Đặt phòng này
          </button>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Updated {room.nextBooking ? formatDateTime(room.nextBooking.startAt) : 'live'}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
