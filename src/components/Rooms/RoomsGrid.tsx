import type { WorkspaceRoom } from '../Workspace';
import EmptyState from '../Shared/EmptyState';
import SectionCard from '../Shared/SectionCard';
import { cn } from '../Shared/cn';
import RoomCard from './RoomCard';

interface RoomsGridProps {
  rooms: WorkspaceRoom[];
  activeRoomId?: string;
  onSelectRoom?: (room: WorkspaceRoom) => void;
  onBookRoom?: (room: WorkspaceRoom) => void;
  title?: string;
  description?: string;
  layout?: 'grid' | 'list';
  className?: string;
}

export default function RoomsGrid({
  rooms,
  activeRoomId,
  onSelectRoom,
  onBookRoom,
  title = 'Rooms',
  description = 'Danh sách phòng, trạng thái live và lối vào hồ sơ phòng.',
  layout = 'grid',
  className,
}: RoomsGridProps) {
  if (rooms.length === 0) {
    return (
      <SectionCard title={title} description={description} accent="teal" className={className}>
        <EmptyState
          title="Chưa có phòng nào"
          description="Khi backend trả danh sách room, grid này sẽ hiển thị trạng thái live, sức chứa và hồ sơ phòng."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title={title} description={description} accent="teal" className={cn('h-full', className)}>
      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto pr-1',
          layout === 'grid' ? 'grid gap-4 lg:grid-cols-2 2xl:grid-cols-3' : 'flex flex-col gap-4'
        )}
      >
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            active={room.id === activeRoomId}
            onSelect={onSelectRoom}
            onBook={onBookRoom}
          />
        ))}
      </div>
    </SectionCard>
  );
}

