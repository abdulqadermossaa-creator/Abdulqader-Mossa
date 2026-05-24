'use client'

import { getTypeIcon, getTypeLabel, getStatusLabel } from '@/lib/utils'

interface ModuleConfig2 {
  sports?: { enabled: boolean }
  music?: { enabled: boolean }
  lighting?: { enabled: boolean }
  tv?: { enabled: boolean }
  presence?: { enabled: boolean }
  ai?: { enabled: boolean }
}

interface HostCardHost {
  id: string
  name: string
  location?: string
  type: string
  status: string
  config?: {
    modules?: ModuleConfig2
    [key: string]: unknown
  }
  created_at?: string
}

interface UnitCardProps {
  host: HostCardHost
  onClick: (id: string) => void
}

const MODULE_MAP: { key: keyof ModuleConfig2; icon: string; label: string }[] = [
  { key: 'sports', icon: '🏆', label: 'Sports' },
  { key: 'music', icon: '🎵', label: 'Music' },
  { key: 'lighting', icon: '💡', label: 'Lighting' },
  { key: 'tv', icon: '📺', label: 'TV' },
  { key: 'presence', icon: '📡', label: 'Presence' },
  { key: 'ai', icon: '🤖', label: 'AI' },
]

export function UnitCard({ host, onClick }: UnitCardProps) {
  const modules = host.config?.modules ?? {}
  const statusDotColor =
    host.status === 'active'
      ? 'var(--success)'
      : host.status === 'maintenance'
      ? 'var(--warning)'
      : 'var(--muted)'
  const statusDotShadow =
    host.status === 'active' ? '0 0 8px rgba(95,184,120,0.6)' : 'none'

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('ar-SA')
    } catch {
      return dateStr
    }
  }

  return (
    <div
      onClick={() => onClick(host.id)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.25s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '14px',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '3px' }}>
            {host.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {host.location}
          </div>
        </div>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(212,165,116,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}
        >
          {getTypeIcon(host.type)}
        </div>
      </div>

      {/* Module Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {MODULE_MAP.map(({ key, icon, label }) => {
          const mod = modules[key]
          const on = mod?.enabled ?? false
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '20px',
                fontSize: '11px',
                border: '1px solid',
                borderColor: on ? 'rgba(95,184,120,0.3)' : 'var(--border)',
                background: on ? 'rgba(95,184,120,0.12)' : 'transparent',
                color: on ? 'var(--success)' : 'var(--muted)',
                opacity: on ? 1 : 0.4,
              }}
            >
              {icon} {label}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: statusDotColor,
              boxShadow: statusDotShadow,
            }}
          />
          <span style={{ color: 'var(--text)' }}>{getStatusLabel(host.status)}</span>
        </div>
        <span className={`tag tag-${host.type}`}>{getTypeLabel(host.type)}</span>
        <span style={{ color: 'var(--muted)', fontSize: '11px' }}>
          {formatDate(host.created_at)}
        </span>
      </div>
    </div>
  )
}
