'use client'

import { EVENTS_META } from '@/lib/types'
import type { EventEntry } from '@/lib/types'

interface EventBusMonitorProps {
  events: EventEntry[]
  onClear: () => void
}

export function EventBusMonitor({ events, onClear }: EventBusMonitorProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '28px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          background: 'var(--bg-elev)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text)',
          }}
        >
          <span className="live-dot" />
          Event Bus Monitor
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {events.length} حدث
          </span>
          {events.length > 0 && (
            <button
              onClick={onClear}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'Tajawal, sans-serif',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Log */}
      <div
        style={{
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minHeight: '200px',
          maxHeight: '320px',
          overflowY: 'auto',
        }}
      >
        {events.length === 0 ? (
          <div
            style={{
              padding: '30px 20px',
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            <div style={{ fontSize: '44px', marginBottom: '10px', opacity: 0.35 }}>📡</div>
            <div>اضغط على أي حدث أعلاه لمحاكاته</div>
          </div>
        ) : (
          events.map((entry, i) => {
            const meta = EVENTS_META[entry.type] ?? { cls: '', icon: '⚡', label: entry.type }
            return (
              <div
                key={`${entry.ts}-${i}`}
                className={`animate-slide-in ${meta.cls}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-elev)',
                  fontSize: '12.5px',
                  borderRight: `3px solid`,
                }}
              >
                <span
                  style={{
                    color: 'var(--muted)',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {entry.time}
                </span>
                <span style={{ fontWeight: 700, fontSize: '11px' }}>
                  {meta.icon} {entry.type}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: '11.5px' }}>
                  ← {entry.host}
                </span>
                <span style={{ flex: 1, color: 'var(--muted)' }}>{meta.label}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
