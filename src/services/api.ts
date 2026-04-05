import axios from 'axios';
import type {
  BookingListResponse,
  BookingRecord,
  BookingResponse,
  BookingStatus,
  ChatMessage,
  ChatRequest,
  ChatRequestContext,
  ChatResponse,
  RoomBookedSlot,
  RoomProfile,
  RoomResponse,
  RoomsResponse,
  SyncStatus,
  SyncStatusEnvelope,
} from '../types';

const DISPLAY_TIMEZONE = 'Asia/Bangkok';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers['ngrok-skip-browser-warning'] = 'true';

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractApiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      (error.response?.data as { error?: string; message?: string } | undefined)?.error ??
      (error.response?.data as { error?: string; message?: string } | undefined)?.message;

    return new Error(responseMessage || error.message || 'Đã có lỗi xảy ra.');
  }

  return error instanceof Error ? error : new Error('Đã có lỗi xảy ra.');
}

function buildSearchParams(params?: Record<string, string | number | undefined>): string {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function buildDateTime(date: string, startTime: string): string {
  return `${date}T${startTime}:00+07:00`;
}

function addMinutes(dateTime: string, duration: number): string {
  return new Date(new Date(dateTime).getTime() + duration * 60 * 1000).toISOString();
}

function getZonedParts(isoValue: string, timezone = DISPLAY_TIMEZONE): { date: string; time: string } {
  const value = new Date(isoValue);
  if (Number.isNaN(value.getTime())) {
    const now = new Date();
    return {
      date: now.toISOString().slice(0, 10),
      time: '00:00',
    };
  }

  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(value);
  const lookup = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';

  return {
    date: `${lookup('year')}-${lookup('month')}-${lookup('day')}`,
    time: `${lookup('hour')}:${lookup('minute')}`,
  };
}

function normalizeBookedSlot(raw: Partial<RoomBookedSlot> = {}): RoomBookedSlot {
  const startAt = raw.startAt ?? new Date().toISOString();
  const endAt = raw.endAt ?? startAt;
  const startParts = getZonedParts(startAt);
  const endParts = getZonedParts(endAt);

  return {
    externalEventId: raw.externalEventId ?? `${startAt}-${endAt}`,
    title: raw.title ?? 'Sự kiện phòng',
    startAt,
    endAt,
    date: raw.date ?? startParts.date,
    startTime: raw.startTime ?? startParts.time,
    endTime: raw.endTime ?? endParts.time,
    status: raw.status ?? 'confirmed',
    source: raw.source ?? 'calendar',
  };
}

function normalizeBookingRecord(
  raw: Partial<BookingRecord> & {
    room?: Partial<RoomProfile>;
    booking?: Partial<BookingRecord>;
    calendarLink?: string;
    status?: BookingStatus;
  } = {}
): BookingRecord {
  const source = (raw.booking ?? raw) as Partial<BookingRecord>;
  const room = raw.room ?? source.room ?? undefined;
  const normalizedRoom = room ? normalizeRoomProfile(room) : undefined;

  const date = source.date ?? raw.date ?? new Date().toISOString().slice(0, 10);
  const startTime = source.startTime ?? raw.startTime ?? '00:00';
  const fallbackStartAt = buildDateTime(date, startTime);
  const startAt = source.startAt ?? raw.startAt ?? fallbackStartAt;
  const endAt =
    source.endAt ??
    raw.endAt ??
    (source.endTime && source.endTime.includes('T')
      ? source.endTime
      : addMinutes(startAt, source.duration ?? raw.duration ?? 60));

  const startParts = getZonedParts(startAt);
  const endParts = getZonedParts(endAt);

  return {
    id: source.id ?? raw.id ?? `booking-${Date.now().toString(36)}`,
    userEmail: source.userEmail ?? raw.userEmail ?? '',
    userName: source.userName ?? raw.userName,
    roomId: source.roomId ?? normalizedRoom?.id ?? 'unknown-room',
    roomName: source.roomName ?? normalizedRoom?.name ?? 'Unknown room',
    date: startParts.date,
    startTime: startParts.time,
    endTime: endParts.time,
    startAt,
    endAt,
    duration: source.duration ?? raw.duration ?? 60,
    title: source.title ?? raw.title ?? `Họp tại phòng ${normalizedRoom?.name ?? source.roomName ?? 'Unknown room'}`,
    status: source.status ?? raw.status ?? 'pending',
    createdAt: source.createdAt ?? raw.createdAt ?? new Date().toISOString(),
    updatedAt: source.updatedAt ?? raw.updatedAt ?? new Date().toISOString(),
    calendarLink: source.calendarLink ?? raw.calendarLink,
    calendarEventId: source.calendarEventId ?? raw.calendarEventId,
    source: source.source ?? raw.source,
    notes: source.notes ?? raw.notes,
    room: normalizedRoom,
  };
}

function normalizeRoomProfile(
  raw: Partial<RoomProfile> & {
    room?: Partial<RoomProfile>;
    status?: {
      status?: RoomProfile['liveStatus'];
      currentBooking?: Partial<BookingRecord> | null;
      nextBooking?: Partial<BookingRecord> | null;
    };
  } = {}
): RoomProfile {
  const source = (raw.room ?? raw) as Partial<RoomProfile>;
  const status = raw.status;

  return {
    id: source.id ?? 'unknown-room',
    name: source.name ?? 'Unknown room',
    capacity: source.capacity ?? 0,
    floor: source.floor,
    description: source.description,
    image: source.image,
    color: source.color,
    equipment: source.equipment ?? [],
    features: source.features ?? [],
    liveStatus: source.liveStatus ?? status?.status ?? 'unknown',
    currentBooking: status?.currentBooking ? normalizeBookingRecord(status.currentBooking) : source.currentBooking ?? null,
    nextBooking: status?.nextBooking ? normalizeBookingRecord(status.nextBooking) : source.nextBooking ?? null,
    bookedSlots: (source.bookedSlots ?? []).map((slot) => normalizeBookedSlot(slot)),
    timezone: source.timezone ?? DISPLAY_TIMEZONE,
  };
}

function normalizeSyncStatus(raw: Partial<SyncStatus> = {}): SyncStatus {
  return {
    state: raw.state ?? 'unknown',
    lastSuccessfulSyncAt: raw.lastSuccessfulSyncAt ?? null,
    lastAttemptAt: raw.lastAttemptAt ?? null,
    pendingChanges: raw.pendingChanges ?? 0,
    roomsSynced: raw.roomsSynced ?? 0,
    message: raw.message ?? null,
  };
}

async function request<T>(method: 'get' | 'post', url: string, payload?: unknown): Promise<T> {
  const response = await api.request<T>({
    method,
    url,
    data: payload,
  });

  return response.data;
}

function isMissingEndpoint(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  return status === 404 || status === 405;
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: { email: string; name: string } }>('post', '/api/auth/login', {
    email,
    password,
  });
}

export async function sendMessage(
  messageOrRequest: string | ChatRequest,
  conversationHistory: Pick<ChatMessage, 'role' | 'content'>[] = [],
  context: ChatRequestContext = {}
): Promise<ChatResponse> {
  const payload: ChatRequest =
    typeof messageOrRequest === 'string'
      ? {
          message: messageOrRequest,
          conversationHistory,
          context,
        }
      : messageOrRequest;

  return request<ChatResponse>('post', '/api/chat', payload);
}

export async function createBooking(
  roomId: string,
  date: string,
  startTime: string,
  duration: number,
  title: string
): Promise<BookingResponse> {
  const payload = { roomId, date, startTime, duration, title };

  try {
    const response = await request<{
      booking: BookingRecord;
      room?: RoomProfile;
      status?: BookingStatus;
      calendarLink?: string;
    }>('post', '/api/bookings', payload);

    return {
      booking: normalizeBookingRecord({
        ...response.booking,
        room: response.room,
        calendarLink: response.calendarLink ?? response.booking?.calendarLink,
        status: response.status ?? response.booking?.status,
      }),
    };
  } catch (error) {
    const resolvedError = extractApiError(error);
    if (!isMissingEndpoint(error)) {
      throw resolvedError;
    }

    const legacy = await request<{
      bookingLink?: string;
      room?: RoomProfile;
    }>('post', '/api/book', payload);

    const startDateTime = buildDateTime(date, startTime);
    const booking = normalizeBookingRecord({
      id: `legacy-${roomId}-${date}-${startTime}`,
      roomId,
      roomName: legacy.room?.name ?? roomId,
      date,
      startTime,
      duration,
      title,
      status: 'pending',
      calendarLink: legacy.bookingLink,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      endAt: addMinutes(startDateTime, duration),
      room: legacy.room,
      source: 'manual',
    });

    return { booking };
  }
}

export async function cancelBooking(bookingId: string): Promise<BookingResponse> {
  try {
    const response = await request<BookingResponse>('post', `/api/bookings/${bookingId}/cancel`);
    return {
      booking: normalizeBookingRecord(response.booking),
    };
  } catch (error) {
    throw extractApiError(error);
  }
}

export async function getRooms(): Promise<RoomsResponse> {
  const response = await request<RoomsResponse>('get', '/api/rooms');

  return {
    rooms: (response.rooms ?? []).map((room) => normalizeRoomProfile(room)),
  };
}

export async function getRoom(roomId: string): Promise<RoomResponse> {
  try {
    const response = await request<RoomResponse>('get', `/api/rooms/${roomId}`);
    return {
      room: normalizeRoomProfile(response.room),
    };
  } catch (error) {
    const resolvedError = extractApiError(error);
    if (!isMissingEndpoint(error)) {
      throw resolvedError;
    }

    const rooms = await getRooms();
    const fallbackRoom = rooms.rooms.find((room) => room.id === roomId);
    return {
      room: fallbackRoom ?? normalizeRoomProfile({ id: roomId, name: roomId, capacity: 0 }),
    };
  }
}

export async function getBookings(params: {
  scope?: 'mine' | 'all';
  status?: BookingStatus | 'all';
  limit?: number;
} = {}): Promise<BookingListResponse> {
  try {
    const response = await request<BookingListResponse>(
      'get',
      `/api/bookings${buildSearchParams({
        scope: params.scope,
        status: params.status,
        limit: params.limit,
      })}`
    );

    return {
      bookings: (response.bookings ?? []).map((booking) => normalizeBookingRecord(booking)),
    };
  } catch (error) {
    const resolvedError = extractApiError(error);
    if (!isMissingEndpoint(error)) {
      throw resolvedError;
    }

    return { bookings: [] };
  }
}

export async function getBooking(bookingId: string): Promise<BookingResponse> {
  try {
    const response = await request<BookingResponse>('get', `/api/bookings/${bookingId}`);
    return {
      booking: normalizeBookingRecord(response.booking),
    };
  } catch (error) {
    throw extractApiError(error);
  }
}

export async function getSyncStatus(): Promise<SyncStatusEnvelope> {
  try {
    const response = await request<SyncStatusEnvelope>('get', '/api/sync/status');
    return {
      sync: normalizeSyncStatus(response.sync),
    };
  } catch (error) {
    const resolvedError = extractApiError(error);
    if (!isMissingEndpoint(error)) {
      throw resolvedError;
    }

    return {
      sync: normalizeSyncStatus(),
    };
  }
}

export async function bookRoom(
  roomId: string,
  date: string,
  startTime: string,
  duration: number,
  title: string
) {
  return createBooking(roomId, date, startTime, duration, title);
}

export default api;
