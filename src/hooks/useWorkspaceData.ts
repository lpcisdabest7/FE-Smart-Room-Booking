import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBooking, getBookings, getRoom, getRooms, getSyncStatus } from '../services/api';
import type { BookingRecord, RoomProfile, SyncHealth, SyncStatus, WorkspaceTab } from '../types';

export interface WorkspaceStats {
  roomsTotal: number;
  roomsAvailableNow: number;
  upcomingBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
}

interface SelectOptions {
  activateTab?: boolean;
}

function isVirtualBookingId(bookingId: string): boolean {
  return bookingId.startsWith('slot:') || bookingId.startsWith('projection:');
}

function parseDateTime(booking: BookingRecord, part: 'start' | 'end'): Date {
  const raw =
    part === 'start'
      ? booking.startAt ?? `${booking.date}T${booking.startTime}:00+07:00`
      : booking.endAt ?? `${booking.date}T${booking.endTime}:00+07:00`;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const fallback = part === 'end' ? `${booking.date}T${booking.endTime}:00+07:00` : `${booking.date}T${booking.startTime}:00+07:00`;
  const parsed = new Date(fallback);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function enrichRoom(room: RoomProfile, bookings: BookingRecord[]): RoomProfile {
  const roomBookings = bookings
    .filter((booking) => booking.roomId === room.id && booking.status !== 'cancelled')
    .sort((a, b) => parseDateTime(a, 'start').getTime() - parseDateTime(b, 'start').getTime());
  const now = Date.now();

  const currentBooking =
    roomBookings.find((booking) => {
      const start = parseDateTime(booking, 'start').getTime();
      const end = parseDateTime(booking, 'end').getTime();
      return start <= now && end > now;
    }) ?? room.currentBooking ?? null;

  const nextBooking =
    roomBookings.find((booking) => parseDateTime(booking, 'start').getTime() > now) ?? room.nextBooking ?? null;

  const liveStatus = room.liveStatus === 'syncing'
    ? 'syncing'
    : currentBooking
      ? 'busy'
      : nextBooking
        ? 'reserved'
        : 'available';

  return {
    ...room,
    liveStatus,
    currentBooking,
    nextBooking,
  };
}

function mergeBooking(existing: BookingRecord[], incoming: BookingRecord): BookingRecord[] {
  const without = existing.filter((booking) => booking.id !== incoming.id);
  return [...without, incoming].sort((a, b) => parseDateTime(b, 'start').getTime() - parseDateTime(a, 'start').getTime());
}

function determineSyncHealth(sync: SyncStatus): SyncHealth {
  if (sync.state === 'healthy' || sync.state === 'degraded' || sync.state === 'offline') {
    return sync.state;
  }
  return 'unknown';
}

export function useWorkspaceData(enabled: boolean) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('assistant');
  const [rooms, setRooms] = useState<RoomProfile[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'unknown',
    pendingChanges: 0,
    roomsSynced: 0,
    lastSuccessfulSyncAt: null,
    lastAttemptAt: null,
    message: null,
  });
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshRooms = useCallback(async () => {
    const response = await getRooms();
    const nextRooms = Array.isArray(response.rooms) ? response.rooms : [];
    setRooms(nextRooms);
    return nextRooms;
  }, []);

  const refreshBookings = useCallback(async () => {
    const response = await getBookings({ scope: 'mine', limit: 200 });
    const nextBookings = Array.isArray(response.bookings) ? response.bookings : [];
    setBookings(nextBookings);
    return nextBookings;
  }, []);

  const refreshSync = useCallback(async () => {
    const response = await getSyncStatus();
    setSyncStatus(response.sync);
    return response.sync;
  }, []);

  const refreshAll = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const [roomResult, bookingResult, syncResult] = await Promise.allSettled([
        refreshRooms(),
        refreshBookings(),
        refreshSync(),
      ]);

      const firstError = [roomResult, bookingResult, syncResult].find(
        (result) => result.status === 'rejected'
      ) as PromiseRejectedResult | undefined;

      if (firstError) {
        setErrorMessage(firstError.reason instanceof Error ? firstError.reason.message : 'Không thể tải dữ liệu workspace.');
      }

      setLastRefreshedAt(new Date().toISOString());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể tải dữ liệu workspace.');
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled, refreshBookings, refreshRooms, refreshSync]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refreshAll();
    const intervalId = window.setInterval(() => {
      void refreshAll();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [enabled, refreshAll]);

  const derivedRooms = useMemo(() => rooms.map((room) => enrichRoom(room, bookings)), [rooms, bookings]);

  const selectedRoom = useMemo(
    () => derivedRooms.find((room) => room.id === selectedRoomId) ?? null,
    [derivedRooms, selectedRoomId]
  );

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId]
  );

  const upcomingBookings = useMemo(
    () => bookings.filter((booking) => parseDateTime(booking, 'start').getTime() >= Date.now() && booking.status !== 'cancelled'),
    [bookings]
  );

  const pastBookings = useMemo(
    () => bookings.filter((booking) => parseDateTime(booking, 'start').getTime() < Date.now() || booking.status === 'cancelled'),
    [bookings]
  );

  const stats = useMemo<WorkspaceStats>(
    () => ({
      roomsTotal: derivedRooms.length,
      roomsAvailableNow: derivedRooms.filter((room) => room.liveStatus === 'available').length,
      upcomingBookings: upcomingBookings.length,
      pendingBookings: bookings.filter((booking) => booking.status === 'pending').length,
      confirmedBookings: bookings.filter((booking) => booking.status === 'confirmed').length,
    }),
    [bookings, derivedRooms, upcomingBookings.length]
  );

  const syncHealth = useMemo(() => determineSyncHealth(syncStatus), [syncStatus]);

  const refreshRoom = useCallback(async (roomId: string) => {
    const response = await getRoom(roomId);
    setRooms((current) => {
      const without = current.filter((room) => room.id !== response.room.id);
      return [...without, response.room].sort((a, b) => a.name.localeCompare(b.name));
    });
    return response.room;
  }, []);

  const refreshBooking = useCallback(async (bookingId: string) => {
    const response = await getBooking(bookingId);
    setBookings((current) => mergeBooking(current, response.booking));
    return response.booking;
  }, []);

  const selectRoom = useCallback(
    async (roomId: string, options: SelectOptions = {}) => {
      setSelectedRoomId(roomId);
      setSelectedBookingId(null);
      if (options.activateTab) {
        setActiveTab('rooms');
      }
      return refreshRoom(roomId);
    },
    [refreshRoom]
  );

  const selectBooking = useCallback(
    async (bookingId: string, options: SelectOptions = {}) => {
      setSelectedBookingId(bookingId);
      const booking = bookings.find((item) => item.id === bookingId);
      if (booking?.roomId) {
        setSelectedRoomId(booking.roomId);
      }
      if (options.activateTab) {
        setActiveTab('bookings');
      }

      if (!bookingId || isVirtualBookingId(bookingId)) {
        return booking ?? null;
      }

      try {
        return await refreshBooking(bookingId);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.toLowerCase().includes('không tìm thấy booking') || message.toLowerCase().includes('not found')) {
          return booking ?? null;
        }
        throw error;
      }
    },
    [bookings, refreshBooking]
  );

  const clearSelection = useCallback(() => {
    setSelectedRoomId(null);
    setSelectedBookingId(null);
  }, []);

  return {
    activeTab,
    setActiveTab,
    rooms: derivedRooms,
    bookings,
    upcomingBookings,
    pastBookings,
    syncStatus,
    syncHealth,
    selectedRoomId,
    selectedBookingId,
    selectedRoom,
    selectedBooking,
    stats,
    isRefreshing,
    lastRefreshedAt,
    errorMessage,
    refreshAll,
    refreshRooms,
    refreshBookings,
    refreshSync,
    refreshRoom,
    refreshBooking,
    selectRoom,
    selectBooking,
    clearSelection,
  };
}
