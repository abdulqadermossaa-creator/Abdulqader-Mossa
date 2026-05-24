// ══════════════════════════════════════════════════════════
// Qlivn OS — TypeScript Types
// ══════════════════════════════════════════════════════════

export type UnitType = 'villa' | 'apartment' | 'chalet'
export type UnitStatus = 'active' | 'inactive' | 'maintenance' | 'cleaning'
export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'
export type BookingSource = 'gathern' | 'airbnb' | 'direct'
export type HostStatus = 'active' | 'inactive' | 'maintenance'

export enum EventType {
  BOOKING_CREATED = 'BOOKING_CREATED',
  CHECKIN_STARTED = 'CHECKIN_STARTED',
  GUEST_ENTERED = 'GUEST_ENTERED',
  CHECKOUT_SOON = 'CHECKOUT_SOON',
  PROPERTY_EMPTY = 'PROPERTY_EMPTY',
  CLEANING_REQUIRED = 'CLEANING_REQUIRED',
}

export interface Unit {
  id: string
  name: string
  image_url?: string
  location?: string
  type: UnitType
  status: UnitStatus
  current_guest_name?: string
  checkout_time?: string
  access_code?: string
  wifi_password?: string
  welcome_message?: string
  config: Record<string, unknown>
  monthly_income: number
  gathern_income: number
  airbnb_income: number
  created_at: string
}

export interface Booking {
  id: string
  unit_id: string
  guest_name: string
  guest_phone?: string
  checkin: string
  checkout: string
  price: number
  source: BookingSource
  status: BookingStatus
  notes?: string
  created_at: string
}

export interface ActivityLog {
  id: string
  unit_id: string
  event_type: string
  details: Record<string, unknown>
  created_at: string
}

export interface AccessCode {
  id: string
  unit_id: string
  code: string
  expires_at: string
  active: boolean
  booking_id?: string
  created_at: string
}

export interface SensorData {
  id: string
  unit_id: string
  motion_detected: boolean
  last_heartbeat?: string
  door_opened: boolean
  created_at: string
}

export interface ModuleConfig {
  sports: {
    enabled: boolean
    leagues: string[]
    match_day_only: boolean
  }
  music: {
    enabled: boolean
    genre: string
    auto_on: boolean
  }
  lighting: {
    enabled: boolean
    scene: string
    auto_dim: boolean
  }
  tv: {
    enabled: boolean
    default_ch: string
  }
  presence: {
    enabled: boolean
    sensitivity: 'low' | 'medium' | 'high'
  }
  ai: {
    enabled: boolean
    personality: 'friendly' | 'professional' | 'minimal'
  }
}

export interface Host {
  id: string
  name: string
  location?: string
  type: UnitType
  status: HostStatus
  welcome_message?: string
  config: {
    modules?: Partial<ModuleConfig>
    [key: string]: unknown
  }
  created_at: string
}

export interface AutomationAction {
  type: string
  label: string
  params?: Record<string, unknown>
}

export interface Automation {
  id: string
  host_id: string
  trigger_event: string
  actions: AutomationAction[]
  is_active: boolean
  created_at: string
}

export interface EventLog {
  id: string
  host_id?: string
  unit_id?: string
  event_type: string
  payload: Record<string, unknown>
  triggered_at: string
}

// UI-facing event entry (local simulation + DB)
export interface EventEntry {
  type: EventType | string
  meta: EventMeta
  time: string
  host: string
  ts: number
}

export interface EventMeta {
  cls: string
  icon: string
  label: string
}

export const EVENTS_META: Record<string, EventMeta> = {
  BOOKING_CREATED: { cls: 'e-booking', icon: '📅', label: 'حجز جديد' },
  CHECKIN_STARTED: { cls: 'e-checkin', icon: '🔑', label: 'بدء تسجيل وصول' },
  GUEST_ENTERED: { cls: 'e-guest', icon: '🚶', label: 'الضيف دخل العقار' },
  CHECKOUT_SOON: { cls: 'e-checkout', icon: '⏰', label: 'اقتراب موعد المغادرة' },
  PROPERTY_EMPTY: { cls: 'e-empty', icon: '🏚️', label: 'العقار فارغ' },
  CLEANING_REQUIRED: { cls: 'e-cleaning', icon: '🧹', label: 'مطلوب تنظيف' },
}

export interface DurationObject {
  hours: number
  minutes: number
  seconds: number
  total: number
}

export interface StatsData {
  totalUnits: number
  activeUnits: number
  totalRevenue: number
  occupancyRate: number
}
