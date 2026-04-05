import type { ReactNode } from 'react';
import type { Room } from '../../types';

export type BookingStatus = 'pending' | 'confirmed' | 'modified' | 'cancelled' | 'sync_error';
export type SyncState = 'synced' | 'syncing' | 'stale' | 'offline';
export type WorkspaceTabId = 'assistant' | 'rooms' | 'bookings';

export interface WorkspaceTab {
  id: WorkspaceTabId;
  label: string;
  description: string;
  badge?: string | number;
  icon?: ReactNode;
}

export interface WorkspaceUser {
  name: string;
  email: string;
  role?: string;
  initials?: string;
  avatarUrl?: string;
}

export interface WorkspaceMetric {
  label: string;
  value: string;
  detail?: string;
  tone?: 'slate' | 'indigo' | 'teal' | 'amber' | 'rose';
}

export interface WorkspaceSyncSnapshot {
  state: SyncState;
  label: string;
  detail?: string;
  lastSyncedAt?: string;
  source?: string;
}

export interface RoomFeature {
  id: string;
  label: string;
  detail?: string;
}

export interface RoomBookingSummary {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  organizer?: string;
  roomName?: string;
}

export interface WorkspaceRoom extends Room {
  floor?: string;
  description?: string;
  imageUrl?: string;
  color?: string;
  status?: 'available' | 'busy' | 'soon' | 'unknown';
  statusLabel?: string;
  features?: RoomFeature[];
  equipment?: string[];
  nextBooking?: RoomBookingSummary;
  upcomingBookings?: RoomBookingSummary[];
  notes?: string[];
  occupancyRate?: number;
}

export interface WorkspaceBooking {
  id: string;
  roomId: string;
  roomName: string;
  title: string;
  status: BookingStatus;
  startAt: string;
  endAt: string;
  organizer?: string;
  participants?: number;
  location?: string;
  notes?: string;
  source?: 'chat' | 'rooms' | 'sync';
  confirmationCode?: string;
  createdAt?: string;
  updatedAt?: string;
  room?: WorkspaceRoom;
  history?: Array<{
    at: string;
    label: string;
    detail?: string;
  }>;
}

