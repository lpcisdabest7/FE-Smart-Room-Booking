import type { ChatMessage as ChatMessageType } from '../../types';
import RoomCard from './RoomCard';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 px-4 py-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Message bubble */}
      <div className={`max-w-[75%] ${isUser ? 'ml-auto' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {/* Room suggestions */}
        {message.type === 'room_suggestions' && message.data?.suggestions && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2 px-1">
              Gợi ý cho bạn
            </p>
            <div className="space-y-2">
              {message.data.suggestions.map((suggestion, idx) => (
                <RoomCard key={idx} suggestion={suggestion} isTopPick={idx === 0} />
              ))}
            </div>
          </div>
        )}

        {/* Alternative slots */}
        {message.type === 'no_rooms' && message.data?.alternativeSlots && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2 px-1">
              Khung giờ thay thế
            </p>
            <div className="space-y-2">
              {message.data.alternativeSlots.map((suggestion, idx) => (
                <RoomCard key={`alt-${idx}`} suggestion={suggestion} />
              ))}
            </div>
          </div>
        )}

        {/* List rooms */}
        {message.type === 'list_rooms' && message.data?.rooms && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2 px-1">
              Danh sách phòng họp
            </p>
            <div className="space-y-2">
              {message.data.rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between border border-gray-200 rounded-xl bg-white shadow-sm p-4 max-w-xs hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{room.name}</h4>
                      <p className="text-xs text-gray-500">{room.capacity} người</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking confirmed (auto-book) */}
        {message.type === 'booking_success' && message.data?.booking && (
          <div className="mt-3 border border-green-200 bg-green-50 rounded-xl p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-bold text-green-800">
                Đặt phòng thành công!
              </span>
            </div>
            <div className="text-xs text-green-700 space-y-1 mb-3 pl-1">
              <p>Phòng: <span className="font-semibold">{message.data.booking.room}</span></p>
              {message.data.booking.capacity && (
                <p>Sức chứa: {message.data.booking.capacity} người</p>
              )}
              <p>Thời gian: {formatTime(message.data.booking.start)} - {formatTime(message.data.booking.end)}</p>
            </div>
            <a
              href={message.data.booking.calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Mở Google Calendar để lưu
            </a>
            <p className="text-[10px] text-green-600 text-center mt-1.5">
              Nhấn "Save" trên Google Calendar để hoàn tất
            </p>
          </div>
        )}

        {/* Booking status check */}
        {message.type === 'booking_status' as string && message.data?.booking && (
          <div className={`mt-3 border rounded-xl p-4 max-w-xs ${
            message.data.confirmed
              ? 'border-green-200 bg-green-50'
              : 'border-yellow-200 bg-yellow-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {message.data.confirmed ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              <span className={`text-sm font-bold ${message.data.confirmed ? 'text-green-800' : 'text-yellow-800'}`}>
                {message.data.confirmed ? 'Đã xác nhận!' : 'Chưa hoàn tất'}
              </span>
            </div>
            <div className={`text-xs space-y-1 mb-3 ${message.data.confirmed ? 'text-green-700' : 'text-yellow-700'}`}>
              <p>Phòng: <span className="font-semibold">{message.data.booking.room}</span></p>
              <p>Thời gian: {formatTime(message.data.booking.start)}</p>
            </div>
            {!message.data.confirmed && message.data.booking.calendarLink && (
              <a
                href={message.data.booking.calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded-lg transition-colors w-full justify-center"
              >
                Mở lại Google Calendar để lưu
              </a>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-gray-400 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatTimestamp(date: Date): string {
  try {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
