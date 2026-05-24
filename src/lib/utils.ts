import type { DurationObject, UnitStatus } from './types'

// ── Format milliseconds to Arabic duration string ─────────────
export function formatTime(ms: number): string {
  if (ms <= 0) return '٠ث'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}س`)
  if (minutes > 0) parts.push(`${minutes}د`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}ث`)
  return parts.join(' ')
}

// ── Generate a random 6-digit access code ─────────────────────
export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── Get Tailwind color class based on unit status ──────────────
export function getUnitStatusColor(status: UnitStatus): string {
  const map: Record<UnitStatus, string> = {
    active: 'text-success',
    inactive: 'text-muted',
    maintenance: 'text-warning',
    cleaning: 'text-info',
  }
  return map[status] ?? 'text-muted'
}

// ── Get status dot Tailwind classes ───────────────────────────
export function getStatusDotClass(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-success shadow-glow',
    inactive: 'bg-muted',
    maintenance: 'bg-warning',
    cleaning: 'bg-info',
  }
  return map[status] ?? 'bg-muted'
}

// ── Format a number as Saudi currency ─────────────────────────
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-SA') + ' ريال'
}

// ── Calculate time remaining until a given date ───────────────
export function timeUntil(date: Date): DurationObject {
  const now = Date.now()
  const target = date.getTime()
  const total = Math.max(0, target - now)
  const totalSeconds = Math.floor(total / 1000)
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    total,
  }
}

// ── Format date to Arabic locale string ───────────────────────
export function formatDateAr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Format time to Arabic HH:MM ──────────────────────────────
export function formatTimeAr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Unit type Arabic labels ───────────────────────────────────
export function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    villa: 'فيلا',
    apartment: 'شقة',
    chalet: 'شاليه',
  }
  return map[type] ?? type
}

// ── Unit type emoji icon ──────────────────────────────────────
export function getTypeIcon(type: string): string {
  const map: Record<string, string> = {
    villa: '🏡',
    apartment: '🏢',
    chalet: '🏕️',
  }
  return map[type] ?? '🏠'
}

// ── Status Arabic labels ──────────────────────────────────────
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'نشط',
    inactive: 'غير نشط',
    maintenance: 'صيانة',
    cleaning: 'تنظيف',
    upcoming: 'قادم',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  }
  return map[status] ?? status
}

// ── Booking source Arabic labels ──────────────────────────────
export function getSourceLabel(source: string): string {
  const map: Record<string, string> = {
    gathern: 'قاذرن',
    airbnb: 'Airbnb',
    direct: 'مباشر',
  }
  return map[source] ?? source
}

// ── Clamp a number between min and max ────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ── Countdown urgency level ────────────────────────────────────
export type UrgencyLevel = 'safe' | 'warning' | 'danger' | 'urgent'

export function getUrgencyLevel(totalMs: number): UrgencyLevel {
  const hours = totalMs / 3600000
  if (hours <= 20 / 60) return 'urgent'
  if (hours <= 1) return 'danger'
  if (hours <= 2) return 'warning'
  return 'safe'
}
