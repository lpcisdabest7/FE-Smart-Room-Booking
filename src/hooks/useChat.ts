import { useCallback, useEffect, useState } from 'react';
import { sendMessage as apiSendMessage } from '../services/api';
import type { BookingRecord, ChatMessage, ChatRequestContext, RoomProfile } from '../types';

const DISPLAY_TIMEZONE = 'Asia/Bangkok';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Xin chào! Tôi có thể giúp bạn tìm phòng, đặt phòng và kiểm tra lịch theo UTC+7.',
  type: 'text',
  timestamp: new Date(),
};

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function storageKey(key: string): string {
  return key || 'chatHistory';
}

function normalizeRoom(room?: Partial<RoomProfile>): RoomProfile {
  return {
    id: room?.id ?? 'unknown-room',
    name: room?.name ?? 'Phòng chưa xác định',
    capacity: room?.capacity ?? 0,
    floor: room?.floor,
    description: room?.description,
    image: room?.image,
    color: room?.color,
    equipment: room?.equipment ?? [],
    features: room?.features ?? [],
    liveStatus: room?.liveStatus ?? 'unknown',
    currentBooking: room?.currentBooking ?? null,
    nextBooking: room?.nextBooking ?? null,
    timezone: room?.timezone,
  };
}

function loadMessages(key: string): ChatMessage[] {
  try {
    const stored = localStorage.getItem(storageKey(key));
    if (!stored) return [{ ...WELCOME_MESSAGE, timestamp: new Date() }];
    const parsed = JSON.parse(stored) as ChatMessage[];
    if (!Array.isArray(parsed)) {
      return [{ ...WELCOME_MESSAGE, timestamp: new Date() }];
    }
    return parsed.map((message) => ({ ...message, timestamp: new Date(message.timestamp) }));
  } catch {
    return [{ ...WELCOME_MESSAGE, timestamp: new Date() }];
  }
}

function saveMessages(key: string, messages: ChatMessage[]) {
  localStorage.setItem(storageKey(key), JSON.stringify(messages));
}

function mapResponse(response: any): ChatMessage {
  if (response.type === 'rooms_available') {
    const start = `${response.searchParams.date}T${response.searchParams.startTime}:00+07:00`;
    const end = new Date(new Date(start).getTime() + response.searchParams.duration * 60 * 1000).toISOString();
    return {
      id: generateId(),
      role: 'assistant',
      content: response.message ?? '',
      type: 'room_suggestions',
      data: {
        panelHint: response.panelHint ?? 'none',
        suggestions: (Array.isArray(response.rooms) ? response.rooms : []).map((room: RoomProfile) => ({
          room: normalizeRoom(room),
          available: true,
          timeSlot: { start, end },
          roomId: room.id,
          panelHint: response.panelHint ?? 'none',
          status: 'available',
        })),
      },
      timestamp: new Date(),
    };
  }

  if (response.type === 'list_rooms') {
    return {
      id: generateId(),
      role: 'assistant',
      content: response.message ?? '',
      type: 'list_rooms',
      data: {
        panelHint: response.panelHint ?? 'none',
        rooms: (Array.isArray(response.rooms) ? response.rooms : []).map((room: RoomProfile) => normalizeRoom(room)),
      },
      timestamp: new Date(),
    };
  }

  if (response.type === 'history_summary') {
    const visibleBookings = (Array.isArray(response.bookings) ? (response.bookings as BookingRecord[]) : []).filter(
      (booking: BookingRecord) => booking.status !== 'cancelled'
    );

    return {
      id: generateId(),
      role: 'assistant',
      content: response.message ?? '',
      type: 'history_summary',
      data: {
        panelHint: response.panelHint ?? 'none',
        bookings: visibleBookings,
      },
      timestamp: new Date(),
    };
  }

  return {
    id: generateId(),
    role: 'assistant',
    content: response.message ?? '',
    type: 'text',
    data: {
      panelHint: response.panelHint ?? 'none',
      roomId: response.roomId,
      bookingId: response.bookingId,
      status: response.status,
      roomSnapshot: response.roomSnapshot ? normalizeRoom(response.roomSnapshot) : undefined,
      bookingSnapshot: response.bookingSnapshot,
    },
    timestamp: new Date(),
  };
}

export function useChat(storage = 'chatHistory') {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(storage));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages(loadMessages(storage));
  }, [storage]);

  useEffect(() => {
    saveMessages(storage, messages);
  }, [messages, storage]);

  const sendMessage = useCallback(
    async (text: string, context: ChatRequestContext = {}) => {
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        type: 'text',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const history = [...messages, userMessage]
          .filter((message) => message.id !== 'welcome')
          .map((message) => ({ role: message.role, content: message.content }));
        const response = await apiSendMessage(text, history, context);
        const assistantMessage = mapResponse(response);
        setMessages((prev) => [...prev, assistantMessage]);
        return assistantMessage;
      } catch (error) {
        const fallback: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: error instanceof Error && error.message ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.',
          type: 'text',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallback]);
        return fallback;
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const resetChat = useCallback(() => {
    const welcome = { ...WELCOME_MESSAGE, timestamp: new Date() };
    setMessages([welcome]);
    saveMessages(storage, [welcome]);
  }, [storage]);

  const addBookingSuccess = useCallback((booking: NonNullable<ChatMessage['data']>['booking']) => {
    const start = booking?.start ? new Date(booking.start) : null;
    const end = booking?.end ? new Date(booking.end) : null;
    const message: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: `Đã tạo booking cho phòng ${booking?.room} từ ${start?.toLocaleString('vi-VN', { timeZone: DISPLAY_TIMEZONE })} đến ${end?.toLocaleString('vi-VN', { timeZone: DISPLAY_TIMEZONE })}.`,
      type: 'booking_success',
      data: { booking },
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  return { messages, isLoading, sendMessage, resetChat, addBookingSuccess };
}
