'use client'

import { useState, useEffect } from 'react'
import { timeUntil, getUrgencyLevel, type UrgencyLevel } from '@/lib/utils'

interface CountdownTimerProps {
  checkoutTime: Date
  compact?: boolean
}

const urgencyConfig: Record<UrgencyLevel, {
  bg: string
  border: string
  text: string
  label: string
  pulsing: boolean
}> = {
  safe: {
    bg: 'rgba(95,184,120,0.08)',
    border: 'rgba(95,184,120,0.3)',
    text: 'var(--success)',
    label: 'وقت كافٍ',
    pulsing: false,
  },
  warning: {
    bg: 'rgba(240,198,116,0.08)',
    border: 'rgba(240,198,116,0.3)',
    text: 'var(--warning)',
    label: 'قريباً من موعد المغادرة',
    pulsing: false,
  },
  danger: {
    bg: 'rgba(229,107,111,0.08)',
    border: 'rgba(229,107,111,0.3)',
    text: 'var(--danger)',
    label: 'ساعة واحدة متبقية!',
    pulsing: false,
  },
  urgent: {
    bg: 'rgba(229,107,111,0.15)',
    border: 'var(--danger)',
    text: 'var(--danger)',
    label: '⚠️ المغادرة قريبة جداً!',
    pulsing: true,
  },
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function CountdownTimer({ checkoutTime, compact = false }: CountdownTimerProps) {
  const [duration, setDuration] = useState(timeUntil(checkoutTime))
  const [urgency, setUrgency] = useState<UrgencyLevel>(
    getUrgencyLevel(timeUntil(checkoutTime).total)
  )

  useEffect(() => {
    const tick = () => {
      const d = timeUntil(checkoutTime)
      setDuration(d)
      setUrgency(getUrgencyLevel(d.total))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [checkoutTime])

  const cfg = urgencyConfig[urgency]

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.text,
          fontSize: '14px',
          fontWeight: 700,
          fontFamily: 'monospace',
          animation: cfg.pulsing ? 'pulse-dot 1s infinite' : 'none',
        }}
      >
        ⏰ {pad(duration.hours)}:{pad(duration.minutes)}:{pad(duration.seconds)}
      </div>
    )
  }

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '14px',
        padding: '24px',
        textAlign: 'center',
        animation: cfg.pulsing ? 'countdown-pulse 1s ease-in-out infinite' : 'none',
        transition: 'all 0.5s ease',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '12px' }}>
        الوقت المتبقي حتى المغادرة
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'Reem Kufi, sans-serif',
        }}
      >
        {/* Hours */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, color: cfg.text, lineHeight: 1 }}>
            {pad(duration.hours)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>ساعة</div>
        </div>
        <div style={{ fontSize: '40px', color: cfg.text, opacity: 0.5, paddingBottom: '16px' }}>:</div>
        {/* Minutes */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, color: cfg.text, lineHeight: 1 }}>
            {pad(duration.minutes)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>دقيقة</div>
        </div>
        <div style={{ fontSize: '40px', color: cfg.text, opacity: 0.5, paddingBottom: '16px' }}>:</div>
        {/* Seconds */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', fontWeight: 700, color: cfg.text, lineHeight: 1 }}>
            {pad(duration.seconds)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>ثانية</div>
        </div>
      </div>

      <div style={{ marginTop: '14px', fontSize: '13px', color: cfg.text, fontWeight: 600 }}>
        {cfg.label}
      </div>
    </div>
  )
}
