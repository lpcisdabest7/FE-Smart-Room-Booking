import type { WorkspaceBooking } from '../Workspace';
import EmptyState from '../Shared/EmptyState';
import SectionCard from '../Shared/SectionCard';
import { cn } from '../Shared/cn';
import BookingCard from './BookingCard';

interface BookingsListProps {
  bookings: WorkspaceBooking[];
  activeBookingId?: string;
  onSelectBooking?: (booking: WorkspaceBooking) => void;
  scope?: 'upcoming' | 'history' | 'all';
  title?: string;
  description?: string;
  className?: string;
}

function isPastBooking(booking: WorkspaceBooking): boolean {
  const start = new Date(booking.startAt);
  return !Number.isNaN(start.getTime()) && start.getTime() < Date.now();
}

export default function BookingsList({
  bookings,
  activeBookingId,
  onSelectBooking,
  scope = 'all',
  title = 'My bookings',
  description = 'Danh sách booking sắp tới và lịch sử đã qua.',
  className,
}: BookingsListProps) {
  const upcoming = bookings.filter((booking) => !isPastBooking(booking));
  const history = bookings.filter(isPastBooking);

  const renderList = (items: WorkspaceBooking[]) => (
    <div className="space-y-4">
      {items.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          active={booking.id === activeBookingId}
          onSelect={onSelectBooking}
        />
      ))}
    </div>
  );

  return (
    <SectionCard title={title} description={description} accent="amber" className={cn('h-full', className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {bookings.length === 0 ? (
          <EmptyState
            title="Chưa có booking"
            description="Khi backend trả data bookings, panel này sẽ hiển thị upcoming, history và trạng thái sync."
          />
        ) : scope === 'upcoming' ? (
          renderList(upcoming)
        ) : scope === 'history' ? (
          renderList(history)
        ) : (
          <div className="space-y-4">
            <SectionCard eyebrow="Upcoming" title={`Sắp tới (${upcoming.length})`} accent="teal" className="p-4">
              {upcoming.length > 0 ? (
                renderList(upcoming)
              ) : (
                <EmptyState title="Không có booking sắp tới" description="Các booking sắp diễn ra sẽ hiện ở đây." />
              )}
            </SectionCard>
            <SectionCard eyebrow="History" title={`Lịch sử (${history.length})`} accent="slate" className="p-4">
              {history.length > 0 ? (
                renderList(history)
              ) : (
                <EmptyState title="Chưa có lịch sử" description="Các booking đã qua sẽ được nhóm ở đây." />
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

