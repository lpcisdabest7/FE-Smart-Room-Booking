import type { RoomSuggestion } from '../../types';

interface RoomCardProps {
  suggestion: RoomSuggestion;
  isTopPick?: boolean;
}

export default function RoomCard({ suggestion, isTopPick }: RoomCardProps) {
  const calendarLink = buildGoogleCalendarLink(
    suggestion.room.name,
    suggestion.timeSlot.start,
    suggestion.timeSlot.end
  );

  return (
    <div
      className={`border rounded-xl bg-white shadow-sm overflow-hidden max-w-xs transition-all ${
        isTopPick
          ? 'border-blue-300 ring-1 ring-blue-100'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="p-4">
        {/* Header: room name + badge */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-900">{suggestion.room.name}</h4>
          {isTopPick && (
            <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              AI Choice
            </span>
          )}
        </div>

        {/* Time slot */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">
            {formatTime(suggestion.timeSlot.start)} - {formatTime(suggestion.timeSlot.end)}
          </span>
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Tối đa {suggestion.room.capacity} người</span>
        </div>

        {/* Book button → opens Google Calendar directly */}
        <a
          href={calendarLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
            isTopPick
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Đặt phòng này
        </a>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Mở Google Calendar → nhấn Save để hoàn tất
        </p>
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

function buildGoogleCalendarLink(
  roomName: string,
  start: string,
  end: string
): string {
  const fmt = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Họp tại phòng ${roomName}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    location: `Phòng ${roomName} - Apero`,
    details: 'Đặt qua Smart Room Booking',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
