const TZ = 'Asia/Bangkok';

function toDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value?: string, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return value || fallback;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: TZ,
  }).format(date);
}

export function formatDateOnly(value?: string, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return value || fallback;
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: TZ,
  }).format(date);
}

export function formatTimeOnly(value?: string, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return value || fallback;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  }).format(date);
}

export function formatTimeRange(start?: string, end?: string, fallback = '—'): string {
  if (!start || !end) return fallback;
  return `${formatTimeOnly(start)} - ${formatTimeOnly(end)}`;
}

export function formatRelativeTime(value?: string, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return value || fallback;

  const deltaMs = date.getTime() - Date.now();
  const absMinutes = Math.round(Math.abs(deltaMs) / 60000);

  if (absMinutes < 1) {
    return deltaMs >= 0 ? 'vừa xong' : 'mới đây';
  }

  if (absMinutes < 60) {
    return deltaMs >= 0 ? `sau ${absMinutes} phút` : `${absMinutes} phút trước`;
  }

  const absHours = Math.round(absMinutes / 60);
  if (absHours < 24) {
    return deltaMs >= 0 ? `sau ${absHours} giờ` : `${absHours} giờ trước`;
  }

  const absDays = Math.round(absHours / 24);
  return deltaMs >= 0 ? `sau ${absDays} ngày` : `${absDays} ngày trước`;
}
