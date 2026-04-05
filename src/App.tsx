import { useEffect, useRef, useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import LoginForm from './components/Auth/LoginForm';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useWorkspaceData } from './hooks/useWorkspaceData';
import { cancelBooking, createBooking } from './services/api';
import type { BookingRecord, ChatMessage, RoomBookedSlot, RoomProfile, RoomSuggestion, WorkspaceTab } from './types';

registerLocale('vi', vi);

type Draft = {
  roomId: string;
  roomName: string;
  startAt: Date | null;
  duration: number;
  title: string;
};

type Modal =
  | { type: 'room'; room: RoomProfile }
  | { type: 'booking'; booking: BookingRecord }
  | { type: 'composer'; room: RoomProfile; draft: Draft }
  | null;

const TZ = 'Asia/Bangkok';
const NAV: { key: WorkspaceTab; label: string; note: string }[] = [
  { key: 'assistant', label: 'Trợ lý', note: 'Chat và điều phối thao tác' },
  { key: 'rooms', label: 'Phòng họp', note: 'Danh sách phòng và lịch đã đặt' },
  { key: 'bookings', label: 'Lịch của tôi', note: 'Booking sắp tới và lịch sử' },
];
const DURATIONS = [30, 45, 60, 90, 120, 150, 180, 240];
const MIN_DURATION = 15;
const MAX_DURATION = 720;

function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return 60;
  if (value < MIN_DURATION) return MIN_DURATION;
  if (value > MAX_DURATION) return MAX_DURATION;
  return Math.round(value);
}

function nextHalfHour(): Date {
  const next = new Date();
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() < 30 ? 30 : 60);
  if (next.getMinutes() === 0) {
    next.setHours(next.getHours() + 1);
  }
  return next;
}

function makeDraft(room: RoomProfile, startAt?: Date, duration = 60): Draft {
  return {
    roomId: room.id,
    roomName: room.name,
    startAt: startAt ?? nextHalfHour(),
    duration: clampDuration(duration),
    title: `Họp tại phòng ${room.name}`,
  };
}

function suggestionDraft(suggestion: RoomSuggestion): Draft {
  const start = new Date(suggestion.timeSlot.start);
  const end = new Date(suggestion.timeSlot.end);
  const duration = Math.round((end.getTime() - start.getTime()) / 60000) || 60;
  return makeDraft(suggestion.room, start, duration);
}

function tone(value?: string): string {
  if (value === 'available' || value === 'confirmed') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  }
  if (value === 'busy' || value === 'cancelled' || value === 'sync_error') {
    return 'border-rose-400/30 bg-rose-500/10 text-rose-100';
  }
  if (value === 'reserved' || value === 'pending' || value === 'modified' || value === 'syncing') {
    return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
  }
  return 'border-white/10 bg-white/5 text-slate-200';
}

function label(value?: string): string {
  switch (value) {
    case 'confirmed':
      return 'Đã đặt';
    case 'pending':
      return 'Đang chờ';
    case 'cancelled':
      return 'Đã hủy';
    case 'modified':
      return 'Đã đổi lịch';
    case 'sync_error':
      return 'Lỗi đồng bộ';
    case 'available':
      return 'Trống';
    case 'busy':
      return 'Đang sử dụng';
    case 'reserved':
      return 'Sắp có lịch';
    case 'syncing':
      return 'Đang đồng bộ';
    default:
      return 'Chưa rõ';
  }
}

function fmt(value?: string | Date | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return 'Chưa cập nhật';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  const hasGranularFields = Boolean(
    opts &&
      (
        opts.weekday !== undefined ||
        opts.era !== undefined ||
        opts.year !== undefined ||
        opts.month !== undefined ||
        opts.day !== undefined ||
        opts.hour !== undefined ||
        opts.minute !== undefined ||
        opts.second !== undefined
      )
  );
  const defaults: Intl.DateTimeFormatOptions = hasGranularFields
    ? {}
    : { dateStyle: 'medium', timeStyle: 'short' };
  return date.toLocaleString('vi-VN', { timeZone: TZ, ...defaults, ...(opts ?? {}) });
}

function parseBookingStart(booking: BookingRecord): Date {
  return new Date(booking.startAt ?? `${booking.date}T${booking.startTime}:00+07:00`);
}

function parseBookingEnd(booking: BookingRecord): Date {
  return new Date(booking.endAt ?? `${booking.date}T${booking.endTime}:00+07:00`);
}

function bookingWindow(booking?: BookingRecord | null): string {
  if (!booking) return 'Chưa có lịch';
  const start = parseBookingStart(booking);
  const end = parseBookingEnd(booking);
  return `${fmt(start, { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} - ${fmt(end, { hour: '2-digit', minute: '2-digit' })}`;
}

function toApiDate(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function toApiTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

function roomCardMeta(room: RoomProfile): string {
  return `${room.capacity} người${room.floor ? ` • Tầng ${room.floor}` : ''}`;
}

function slotText(slot: RoomBookedSlot): string {
  return `${slot.date} ${slot.startTime} - ${slot.endTime}`;
}

export default function App() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const { messages, isLoading, sendMessage, resetChat, addBookingSuccess } = useChat(`chatHistory:${user?.email ?? 'guest'}`);
  const workspace = useWorkspaceData(isAuthenticated);
  const [messageInput, setMessageInput] = useState('');
  const [uiError, setUiError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [isSavingBooking, setIsSavingBooking] = useState(false);
  const [isCancellingBookingId, setIsCancellingBookingId] = useState<string | null>(null);
  const chatListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chatListRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessageInput('');
      setUiError(null);
      setModal(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setModal(null);
  }, [workspace.activeTab]);

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  const activeRoom = modal?.type === 'room' || modal?.type === 'composer' ? modal.room : workspace.selectedRoom;
  const activeBooking = modal?.type === 'booking' ? modal.booking : workspace.selectedBooking;
  const errorText = uiError ?? workspace.errorMessage ?? null;
  const roomsList = Array.isArray(workspace.rooms) ? workspace.rooms : [];
  const upcomingBookingsList = Array.isArray(workspace.upcomingBookings) ? workspace.upcomingBookings : [];
  const pastBookingsList = Array.isArray(workspace.pastBookings) ? workspace.pastBookings : [];

  async function openRoom(room: RoomProfile) {
    setUiError(null);
    try {
      const fresh = await workspace.selectRoom(room.id, { activateTab: false });
      setModal({ type: 'room', room: fresh ?? room });
    } catch (error) {
      setUiError(error instanceof Error ? error.message : 'Không thể tải hồ sơ phòng.');
      setModal({ type: 'room', room });
    }
  }

  async function openBooking(booking: BookingRecord) {
    setUiError(null);
    try {
      const fresh = await workspace.selectBooking(booking.id, { activateTab: false });
      setModal({ type: 'booking', booking: fresh ?? booking });
    } catch (error) {
      setUiError(error instanceof Error ? error.message : 'Không thể tải chi tiết booking.');
      setModal({ type: 'booking', booking });
    }
  }

  function openComposer(room: RoomProfile, draft?: Draft) {
    setUiError(null);
    setModal({ type: 'composer', room, draft: draft ?? makeDraft(room) });
  }

  async function submitDraft(draft: Draft) {
    const safeDuration = clampDuration(draft.duration);
    if (!draft.startAt) {
      setUiError('Vui lòng chọn ngày giờ bắt đầu.');
      return;
    }
    if (!draft.title.trim()) {
      setUiError('Vui lòng nhập tiêu đề cho booking.');
      return;
    }
    if (draft.startAt.getTime() <= Date.now()) {
      setUiError('Không thể đặt phòng trong quá khứ.');
      return;
    }
    if (safeDuration < MIN_DURATION) {
      setUiError(`Thời lượng tối thiểu là ${MIN_DURATION} phút.`);
      return;
    }

    setUiError(null);
    setIsSavingBooking(true);
    try {
      const response = await createBooking(
        draft.roomId,
        toApiDate(draft.startAt),
        toApiTime(draft.startAt),
        safeDuration,
        draft.title.trim()
      );
      const booking = response.booking;
      addBookingSuccess({
        calendarLink: booking.calendarLink ?? '',
        summary: booking.title,
        start: booking.startAt ?? `${booking.date}T${booking.startTime}:00+07:00`,
        end: booking.endAt ?? `${booking.date}T${booking.endTime}:00+07:00`,
        room: booking.roomName,
        capacity: booking.room?.capacity,
      });
      await workspace.refreshAll();
      setModal({ type: 'booking', booking });
      workspace.setActiveTab('bookings');
    } catch (error) {
      setUiError(error instanceof Error ? error.message : 'Không thể tạo booking.');
    } finally {
      setIsSavingBooking(false);
    }
  }

  async function cancelCurrentBooking(booking: BookingRecord) {
    setUiError(null);
    setIsCancellingBookingId(booking.id);
    try {
      const response = await cancelBooking(booking.id);
      await workspace.refreshAll();
      setModal({ type: 'booking', booking: response.booking });
    } catch (error) {
      setUiError(error instanceof Error ? error.message : 'Không thể hủy booking.');
    } finally {
      setIsCancellingBookingId(null);
    }
  }

  async function onSend() {
    const text = messageInput.trim();
    if (!text) return;
    setMessageInput('');
    setUiError(null);
    try {
      const bot = await sendMessage(text, {
        activeTab: workspace.activeTab,
        selectedRoomId: activeRoom?.id ?? null,
        selectedBookingId: activeBooking?.id ?? null,
      });
      if (bot.type === 'booking_success' || bot.type === 'booking_status' || bot.type === 'history_summary') {
        await workspace.refreshAll();
      }
    } catch (error) {
      setUiError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  }

  const roomListCard = (room: RoomProfile) => (
    <article key={room.id} className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4">
      <h3 className="text-base font-semibold text-white">{room.name}</h3>
      <p className="mt-1 text-xs text-slate-400">{roomCardMeta(room)}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{room.description ?? 'Chưa có mô tả cho phòng này.'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="cursor-pointer rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:bg-white/5"
          onClick={() => void openRoom(room)}
        >
          Xem lịch đã đặt
        </button>
        <button
          className="cursor-pointer rounded-full bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-400"
          onClick={() => openComposer(room)}
        >
          Đặt phòng này
        </button>
      </div>
    </article>
  );

  const messageNode = (message: ChatMessage) => (
    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
      {message.role === 'assistant' ? (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-xs font-semibold text-sky-100">
          AI
        </div>
      ) : null}
      <div className={`max-w-[min(820px,94%)] ${message.role === 'user' ? 'ml-auto' : ''}`}>
        <div
          className={`rounded-[28px] px-4 py-3 text-sm leading-6 ${
            message.role === 'user'
              ? 'bg-sky-500 text-white shadow-[0_18px_45px_rgba(14,165,233,0.25)]'
              : 'border border-white/10 bg-slate-950/90 text-slate-100'
          }`}
        >
          {message.content}
        </div>

        {message.type === 'list_rooms' && Array.isArray(message.data?.rooms) ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">{message.data?.rooms.map(roomListCard)}</div>
        ) : null}

        {message.type === 'room_suggestions' && Array.isArray(message.data?.suggestions) ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {message.data?.suggestions
              .filter((suggestion) => Boolean(suggestion?.room?.id) && Boolean(suggestion?.timeSlot?.start) && Boolean(suggestion?.timeSlot?.end))
              .map((suggestion) => (
              <article
                key={`${suggestion.room.id}-${suggestion.timeSlot.start}`}
                className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">{suggestion.room.name}</h4>
                    <p className="text-xs text-slate-400">{roomCardMeta(suggestion.room)}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${tone(suggestion.status)}`}>
                    {label(suggestion.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  {fmt(new Date(suggestion.timeSlot.start), {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  - {fmt(new Date(suggestion.timeSlot.end), { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="cursor-pointer rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:bg-white/5"
                    onClick={() => void openRoom(suggestion.room)}
                  >
                    Xem phòng
                  </button>
                  <button
                    className="cursor-pointer rounded-full bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-400"
                    onClick={() => openComposer(suggestion.room, suggestionDraft(suggestion))}
                  >
                    Đặt khung giờ này
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {message.type === 'history_summary' && Array.isArray(message.data?.bookings) ? (
          <div className="mt-3 grid gap-3">
            {message.data?.bookings.map((booking) => (
              <article key={booking.id} className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{booking.roomName}</p>
                    <p className="mt-1 text-sm text-slate-400">{bookingWindow(booking)}</p>
                  </div>
                  <button
                    className="cursor-pointer rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:bg-white/5"
                    onClick={() => void openBooking(booking)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.1),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#08101b_48%,_#040814_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1620px] flex-col">
        <header className="border-b border-white/10 bg-slate-950/75 px-4 py-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-sky-300">Apero Smart Room Booking</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Đặt phòng trực tiếp trên web</h1>
              <p className="mt-1 text-sm text-slate-400">
                Toàn bộ thời gian hiển thị theo UTC+7. Chat không tự chuyển màn, popup chỉ dùng cho chi tiết và đặt phòng.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-2 text-xs ${tone(workspace.syncHealth)}`}>
                Đồng bộ:{' '}
                {workspace.syncHealth === 'healthy'
                  ? 'Tốt'
                  : workspace.syncHealth === 'degraded'
                    ? 'Cảnh báo'
                    : workspace.syncHealth === 'offline'
                      ? 'Ngoại tuyến'
                      : 'Chưa rõ'}
              </span>
              <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                {workspace.stats.roomsAvailableNow}/{workspace.stats.roomsTotal} phòng trống
              </span>
              <button
                className="cursor-pointer rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:bg-white/5"
                onClick={() => void workspace.refreshAll()}
              >
                {workspace.isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
              </button>
              <button
                className="cursor-pointer rounded-full border border-sky-400/30 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/10"
                onClick={() => {
                  resetChat();
                  workspace.clearSelection();
                  setModal(null);
                  setUiError(null);
                  workspace.setActiveTab('assistant');
                }}
              >
                Chat mới
              </button>
              <button
                className="cursor-pointer rounded-full border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/10"
                onClick={() => {
                  resetChat();
                  logout();
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-4 p-4 xl:grid-cols-[250px_minmax(0,1fr)_330px]">
          <aside className="rounded-[32px] border border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/65 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300">Workspace</p>
              <p className="mt-3 text-lg font-semibold text-white">{user?.name || user?.email}</p>
              <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
            </div>
            <div className="mt-4 grid gap-2">
              {NAV.map((item) => (
                <button
                  key={item.key}
                  className={`cursor-pointer rounded-[24px] border px-4 py-4 text-left transition ${
                    workspace.activeTab === item.key
                      ? 'border-sky-400/40 bg-sky-500/10'
                      : 'border-white/10 bg-slate-950/45 hover:border-white/20 hover:bg-white/5'
                  }`}
                  onClick={() => workspace.setActiveTab(item.key)}
                >
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.note}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[32px] border border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl">
            {errorText ? (
              <div className="mb-4 rounded-[24px] border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorText}
              </div>
            ) : null}

            {workspace.activeTab === 'assistant' ? (
              <div className="flex min-h-[74vh] flex-col">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Đồng bộ gần nhất</p>
                    <p className="mt-3 text-sm font-semibold text-white">{fmt(workspace.syncStatus.lastSuccessfulSyncAt)}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Thay đổi chờ xử lý</p>
                    <p className="mt-3 text-sm font-semibold text-white">{workspace.syncStatus.pendingChanges}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Múi giờ</p>
                    <p className="mt-3 text-sm text-slate-300">Hệ thống luôn hiển thị theo UTC+7.</p>
                  </div>
                </div>

                <div ref={chatListRef} className="mt-4 h-[calc(100vh-390px)] space-y-3 overflow-y-auto pr-1">
                  {messages.map(messageNode)}
                </div>

                <form
                  className="mt-4 rounded-[30px] border border-white/10 bg-slate-950/85 p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onSend();
                  }}
                >
                  <textarea
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void onSend();
                      }
                    }}
                    rows={3}
                    placeholder="Ví dụ: phòng nào trống hôm nay 16:00? hoặc đặt giúp tôi phòng US từ 16:00 đến 18:00."
                    className="min-h-[108px] w-full resize-none rounded-[24px] border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">Hệ thống tự kiểm tra trùng lịch trước khi tạo booking.</p>
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || isLoading}
                      className="cursor-pointer rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                    >
                      {isLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            {workspace.activeTab === 'rooms' ? (
              <div className="grid gap-3 md:grid-cols-2">{roomsList.map(roomListCard)}</div>
            ) : null}

            {workspace.activeTab === 'bookings' ? (
              <div className="space-y-6">
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-white">Lịch sắp tới</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {upcomingBookingsList.length ? (
                      upcomingBookingsList.map((booking) => (
                        <article key={booking.id} className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-white">{booking.title}</h3>
                              <p className="text-xs text-slate-400">{booking.roomName}</p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs ${tone(booking.status)}`}>
                              {label(booking.status)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-slate-300">{bookingWindow(booking)}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              className="cursor-pointer rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:bg-white/5"
                              onClick={() => void openBooking(booking)}
                            >
                              Xem chi tiết
                            </button>
                            {booking.status !== 'cancelled' ? (
                              <button
                                className="cursor-pointer rounded-full border border-rose-400/30 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/10"
                                onClick={() => void cancelCurrentBooking(booking)}
                                disabled={isCancellingBookingId === booking.id}
                              >
                                {isCancellingBookingId === booking.id ? 'Đang hủy...' : 'Hủy booking'}
                              </button>
                            ) : null}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-400">
                        Chưa có lịch sắp tới.
                      </div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-sm font-semibold text-white">Lịch sử</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pastBookingsList.length ? (
                      pastBookingsList.map((booking) => (
                        <article key={booking.id} className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-white">{booking.title}</h3>
                              <p className="text-xs text-slate-400">{booking.roomName}</p>
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs ${tone(booking.status)}`}>
                              {label(booking.status)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-slate-300">{bookingWindow(booking)}</p>
                          <button
                            className="mt-4 cursor-pointer rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-sky-300/30 hover:bg-white/5"
                            onClick={() => void openBooking(booking)}
                          >
                            Xem chi tiết
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-400">
                        Chưa có lịch sử booking.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : null}
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-slate-900/70 p-4 backdrop-blur-xl">
            <h2 className="text-base font-semibold text-white">
              {modal?.type === 'composer'
                ? 'Booking Composer'
                : activeBooking
                  ? 'Chi tiết booking'
                  : activeRoom
                    ? 'Hồ sơ phòng'
                    : 'Tình trạng đồng bộ'}
            </h2>

            {!activeRoom && !activeBooking && !modal?.type ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Thông điệp hệ thống</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {workspace.syncStatus.message || 'Hệ thống đang chờ dữ liệu đồng bộ từ lịch phòng.'}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Đồng bộ thành công gần nhất</p>
                  <p className="mt-2 text-sm text-white">{fmt(workspace.syncStatus.lastSuccessfulSyncAt)}</p>
                </div>
              </div>
            ) : null}

            {activeRoom && !activeBooking && !modal?.type ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-lg font-semibold text-white">{activeRoom.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{roomCardMeta(activeRoom)}</p>
                  <p className="mt-3 text-sm text-slate-300">{activeRoom.description ?? 'Chưa có mô tả cho phòng này.'}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                  <p>Hiện tại: {bookingWindow(activeRoom.currentBooking)}</p>
                  <p className="mt-2">Tiếp theo: {bookingWindow(activeRoom.nextBooking)}</p>
                </div>
                <button
                  className="w-full cursor-pointer rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
                  onClick={() => openComposer(activeRoom)}
                >
                  Đặt phòng này
                </button>
              </div>
            ) : null}
          </aside>
        </main>

        {modal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md" onClick={() => setModal(null)}>
            <div
              className="w-full max-w-3xl rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,21,38,0.98),rgba(7,15,28,0.96))] p-6 shadow-[0_30px_120px_rgba(2,8,23,0.55)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.34em] text-sky-300">Quick View</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">
                    {modal.type === 'composer'
                      ? 'Booking Composer'
                      : modal.type === 'booking'
                        ? 'Chi tiết booking'
                        : 'Hồ sơ phòng'}
                  </h2>
                </div>
                <button
                  className="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-300/30 hover:bg-white/5"
                  onClick={() => setModal(null)}
                >
                  Đóng
                </button>
              </div>

              {errorText ? (
                <div className="mt-4 rounded-[24px] border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {errorText}
                </div>
              ) : null}

              {modal.type === 'composer' ? (
                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-5">
                    <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xl font-semibold text-white">{modal.room.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{roomCardMeta(modal.room)} • Đặt trực tiếp trên web</p>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {modal.room.description ?? 'Chưa có mô tả cho phòng này.'}
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Ngày và giờ bắt đầu</span>
                      <DatePicker
                        locale="vi"
                        selected={modal.draft.startAt}
                        onChange={(value: Date | null) => value && setModal({ ...modal, draft: { ...modal.draft, startAt: value } })}
                        showTimeSelect
                        timeIntervals={15}
                        timeCaption="Giờ"
                        dateFormat="dd/MM/yyyy HH:mm"
                        minDate={new Date()}
                        className="booking-picker w-full rounded-[20px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
                        placeholderText="Chọn ngày và giờ"
                      />
                    </label>

                    <div>
                      <span className="mb-2 block text-sm font-medium text-slate-200">Thời lượng</span>
                      <div className="flex flex-wrap gap-2">
                        {DURATIONS.map((duration) => (
                          <button
                            key={duration}
                            type="button"
                            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
                              modal.draft.duration === duration
                                ? 'border-sky-300/40 bg-sky-500 text-white'
                                : 'border-white/10 bg-slate-950/60 text-slate-200 hover:border-sky-300/30 hover:bg-white/5'
                            }`}
                            onClick={() => setModal({ ...modal, draft: { ...modal.draft, duration } })}
                          >
                            {duration} phút
                          </button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <label className="mb-2 block text-xs text-slate-400">
                          Nhập thời lượng tùy chỉnh (15 - 720 phút)
                        </label>
                        <input
                          type="number"
                          min={MIN_DURATION}
                          max={MAX_DURATION}
                          step={15}
                          value={modal.draft.duration}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            setModal({
                              ...modal,
                              draft: {
                                ...modal.draft,
                                duration: clampDuration(next),
                              },
                            });
                          }}
                          className="w-full rounded-[16px] border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Tiêu đề cuộc họp</span>
                      <input
                        type="text"
                        value={modal.draft.title}
                        onChange={(event) => setModal({ ...modal, draft: { ...modal.draft, title: event.target.value } })}
                        placeholder="Ví dụ: Daily sync team sản phẩm"
                        className="w-full rounded-[20px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </label>

                    <div className="rounded-[28px] border border-amber-400/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50">
                      Nếu đã có booking 14:00 - 17:00 thì yêu cầu 16:00 - 18:00 sẽ bị từ chối.
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isSavingBooking}
                        className="cursor-pointer rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                        onClick={() => void submitDraft(modal.draft)}
                      >
                        {isSavingBooking ? 'Đang tạo booking...' : 'Tạo booking'}
                      </button>
                      <button
                        type="button"
                        className="cursor-pointer rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-sky-300/30 hover:bg-white/5"
                        onClick={() => setModal(null)}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tóm tắt</p>
                      <p className="mt-3 text-lg font-semibold text-white">{modal.draft.title || 'Chưa có tiêu đề'}</p>
                      <p className="mt-2 text-sm text-slate-300">{modal.draft.roomName}</p>
                      <p className="mt-2 text-sm text-slate-300">{fmt(modal.draft.startAt, { dateStyle: 'full', timeStyle: 'short' })}</p>
                      <p className="mt-2 text-sm text-slate-300">Thời lượng: {modal.draft.duration} phút</p>
                    </div>
                    <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lịch đã đặt của phòng</p>
                      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                        {(modal.room.bookedSlots ?? []).slice(0, 12).map((slot) => (
                          <div key={slot.externalEventId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <p className="text-sm font-medium text-white">{slot.title}</p>
                            <p className="mt-1 text-xs text-slate-300">{slotText(slot)}</p>
                          </div>
                        ))}
                        {!modal.room.bookedSlots?.length ? (
                          <p className="text-sm text-slate-400">Chưa có dữ liệu booking của phòng.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {modal.type === 'booking' ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Booking</p>
                    <p className="mt-3 text-xl font-semibold text-white">{modal.booking.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{modal.booking.roomName}</p>
                    <p className="mt-2 text-sm text-slate-300">{bookingWindow(modal.booking)}</p>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trạng thái</p>
                    <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${tone(modal.booking.status)}`}>
                      {label(modal.booking.status)}
                    </span>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      Booking này được tạo trực tiếp trên web thay cho người dùng.
                    </p>
                    <p className="mt-2 text-sm text-slate-400">Cập nhật lần cuối: {fmt(modal.booking.updatedAt)}</p>
                    {modal.booking.status !== 'cancelled' ? (
                      <button
                        className="mt-4 cursor-pointer rounded-full border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
                        onClick={() => void cancelCurrentBooking(modal.booking)}
                        disabled={isCancellingBookingId === modal.booking.id}
                      >
                        {isCancellingBookingId === modal.booking.id ? 'Đang hủy...' : 'Hủy booking'}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {modal.type === 'room' ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xl font-semibold text-white">{modal.room.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{roomCardMeta(modal.room)}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {modal.room.description ?? 'Chưa có mô tả cho phòng này.'}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">Hiện tại: {bookingWindow(modal.room.currentBooking)}</p>
                    <p className="mt-2 text-sm text-slate-300">Tiếp theo: {bookingWindow(modal.room.nextBooking)}</p>
                    <button
                      className="mt-4 cursor-pointer rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
                      onClick={() => openComposer(modal.room)}
                    >
                      Đặt phòng này
                    </button>
                  </div>
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Các khung giờ đã đặt</p>
                    <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                      {(modal.room.bookedSlots ?? []).map((slot) => (
                        <div key={slot.externalEventId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-sm font-medium text-white">{slot.title}</p>
                          <p className="mt-1 text-xs text-slate-300">{slotText(slot)}</p>
                        </div>
                      ))}
                      {!modal.room.bookedSlots?.length ? (
                        <p className="text-sm text-slate-400">Phòng chưa có lịch trong dữ liệu đồng bộ hiện tại.</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
