export interface User {
  email: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export type RoomLiveStatus = 'available' | 'busy' | 'reserved' | 'syncing' | 'unknown';

export type BookingStatus = 'pending' | 'confirmed' | 'modified' | 'cancelled' | 'sync_error';

export type SyncHealth = 'healthy' | 'degraded' | 'offline' | 'unknown';

export type WorkspaceTab = 'assistant' | 'rooms' | 'bookings';

export type WorkspacePanelHint = 'none' | 'room-profile' | 'booking-detail' | 'history' | 'sync' | 'rooms';

export type AssistantActionKind = 'open-room' | 'open-booking' | 'refresh' | 'create-booking';

export interface WorkspaceAction {
  label: string;
  kind: AssistantActionKind;
  roomId?: string;
  bookingId?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface BookingRecord {
  id: string;
  userEmail: string;
  userName?: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  startAt?: string;
  endAt?: string;
  duration: number;
  title: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  calendarLink?: string;
  calendarEventId?: string;
  source?: 'chat' | 'manual' | 'sync' | 'system' | 'google_calendar' | 'recall' | 'ical_fallback';
  notes?: string;
  room?: RoomProfile;
}

export interface RoomBookedSlot {
  externalEventId: string;
  title: string;
  startAt: string;
  endAt: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
}

export interface RoomProfile extends Room {
  floor?: number;
  description?: string;
  image?: string;
  color?: string;
  equipment?: string[];
  features?: string[];
  liveStatus?: RoomLiveStatus;
  currentBooking?: BookingRecord | null;
  nextBooking?: BookingRecord | null;
  bookedSlots?: RoomBookedSlot[];
  timezone?: string;
}

export interface RoomSuggestion {
  room: RoomProfile;
  available: boolean;
  timeSlot: TimeSlot;
  panelHint?: WorkspacePanelHint;
  roomId?: string;
  bookingId?: string;
  status?: BookingStatus | RoomLiveStatus;
}

export interface SyncStatus {
  state: SyncHealth;
  lastSuccessfulSyncAt?: string | null;
  lastAttemptAt?: string | null;
  pendingChanges: number;
  roomsSynced: number;
  message?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'room_suggestions' | 'no_rooms' | 'clarification' | 'booking_success' | 'list_rooms' | 'booking_status' | 'room_profile' | 'booking_detail' | 'history_summary' | 'sync_status';
  data?: {
    suggestions?: RoomSuggestion[];
    alternativeSlots?: RoomSuggestion[];
    rooms?: RoomProfile[];
    confirmed?: boolean;
    booking?: {
      calendarLink: string;
      summary: string;
      start: string;
      end: string;
      room: string;
      capacity?: number;
    };
    bookingId?: string;
    roomId?: string;
    status?: BookingStatus;
    panelHint?: WorkspacePanelHint;
    roomSnapshot?: RoomProfile;
    bookingSnapshot?: BookingRecord;
    sync?: SyncStatus;
    bookings?: BookingRecord[];
    actions?: WorkspaceAction[];
  };
  timestamp: Date;
}

export interface ChatRequestContext {
  activeTab?: WorkspaceTab;
  selectedRoomId?: string | null;
  selectedBookingId?: string | null;
}

export interface ChatRequest {
  message: string;
  conversationHistory: Pick<ChatMessage, 'role' | 'content'>[];
  context?: ChatRequestContext;
}

export interface ChatResponseBase {
  type: string;
  message?: string;
  panelHint?: WorkspacePanelHint;
  roomId?: string;
  bookingId?: string;
  status?: BookingStatus;
  roomSnapshot?: RoomProfile;
  bookingSnapshot?: BookingRecord;
}

export interface RoomsAvailableResponse extends ChatResponseBase {
  type: 'rooms_available';
  rooms: RoomProfile[];
  searchParams: {
    numberOfPeople: number;
    date: string;
    startTime: string;
    duration: number;
  };
}

export interface NoAvailabilityResponse extends ChatResponseBase {
  type: 'no_availability';
  alternatives: Array<{
    startTime: string;
    endTime: string;
    rooms: RoomProfile[];
  }>;
}

export interface ListRoomsResponse extends ChatResponseBase {
  type: 'list_rooms';
  rooms: RoomProfile[];
}

export interface BookingConfirmedResponse extends ChatResponseBase {
  type: 'booking_confirmed';
  booking: Partial<BookingRecord> & {
    room?: RoomProfile | string;
    roomName?: string;
    title?: string;
    summary?: string;
    start?: string;
    end?: string;
    startAt?: string;
    endAt?: string;
    calendarLink?: string | null;
    capacity?: number;
  };
}

export interface BookingStatusResponse extends ChatResponseBase {
  type: 'booking_status';
  booking?: BookingRecord;
  confirmed?: boolean;
  totalBookings?: number;
}

export interface RoomProfileResponse extends ChatResponseBase {
  type: 'room_profile';
  room: RoomProfile;
}

export interface BookingDetailResponse extends ChatResponseBase {
  type: 'booking_detail';
  booking: BookingRecord;
}

export interface HistorySummaryResponse extends ChatResponseBase {
  type: 'history_summary';
  bookings: BookingRecord[];
}

export interface SyncStatusResponse extends ChatResponseBase {
  type: 'sync_status';
  sync: SyncStatus;
}

export type ChatResponse =
  | RoomsAvailableResponse
  | NoAvailabilityResponse
  | ListRoomsResponse
  | BookingConfirmedResponse
  | BookingStatusResponse
  | RoomProfileResponse
  | BookingDetailResponse
  | HistorySummaryResponse
  | SyncStatusResponse
  | ChatResponseBase;

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface RoomsResponse {
  rooms: RoomProfile[];
}

export interface RoomResponse {
  room: RoomProfile;
}

export interface BookingListResponse {
  bookings: BookingRecord[];
}

export interface BookingResponse {
  booking: BookingRecord;
}

export interface SyncStatusEnvelope {
  sync: SyncStatus;
}
