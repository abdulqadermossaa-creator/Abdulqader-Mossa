'use client'

import { useState, useEffect } from 'react'
import { timeUntil, getUrgencyLevel, type UrgencyLevel } from '@/lib/utils'

interface CheckoutCountdownProps {
  checkoutTime: Date
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

const urgencyTheme: Record<UrgencyLevel, {
  bg: string
  border: string
  text: string
  label: string
  sublabel: string
  pulsing: boolean
}> = {
  safe: {
    bg: 'rgba(95,184,120,0.06)',
    border: 'rgba(95,184,120,0.2)',
    text: 'var(--success)',
    label: 'الوقت المتبقي',
    sublabel: 'نتمنى لكم إقامة ممتعة',
    pulsing: false,
  },
  warning: {
    bg: 'rgba(240,198,116,0.08)',
    border: 'rgba(240,198,116,0.3)',
    text: 'var(--warning)',
    label: '⚠️ تذكير بموعد المغادرة',
    sublabel: 'يرجى الاستعداد للمغادرة خلال ساعتين',
    pulsing: false,
  },
  danger: {
    bg: 'rgba(229,107,111,0.08)',
    border: 'rgba(229,107,111,0.3)',
    text: 'var(--danger)',
    label: '🔴 موعد المغادرة قريب',
    sublabel: 'يرجى المغادرة في الوقت المحدد',
    pulsing: false,
  },
  urgent: {
    bg: 'rgba(229,107,111,0.15)',
    border: 'var(--danger)',
    text: 'var(--danger)',
    label: '🚨 المغادرة الآن!',
    sublabel: 'يرجى المغادرة فوراً وإرجاع المفاتيح',
    pulsing: true,
  },
}

export function CheckoutCountdown({ checkoutTime }: CheckoutCountdownProps) {
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

  const theme = urgencyTheme[urgency]
  const isExpired = duration.total <= 0

  return (
    <div
      style={{
        background: theme.bg,
        border: `2px solid ${theme.border}`,
        borderRadius: '20px',
        padding: '32px 40px',
        textAlign: 'center',
        transition: 'all 0.5s ease',
        animation: theme.pulsing ? 'urgentPulse 1s ease-in-out infinite' : 'none',
      }}
    >
      <style>{`
        @keyframes urgentPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.01); }
        }
      `}</style>

      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: theme.text,
          marginBottom: '16px',
        }}
      >
        {theme.label}
      </div>

      {isExpired ? (
        <div
          style={{
            fontFamily: 'Reem Kufi, sans-serif',
            fontSize: '48px',
            fontWeight: 700,
            color: 'var(--danger)',
          }}
        >
          انتهى الوقت
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'Reem Kufi, sans-serif',
          }}
        >
          <TimeBlock value={duration.hours} label="ساعة" color={theme.text} large />
          <span style={{ fontSize: '60px', color: theme.text, opacity: 0.4, paddingBottom: '24px' }}>
            :
          </span>
          <TimeBlock value={duration.minutes} label="دقيقة" color={theme.text} large />
          <span style={{ fontSize: '60px', color: theme.text, opacity: 0.4, paddingBottom: '24px' }}>
            :
          </span>
          <TimeBlock value={duration.seconds} label="ثانية" color={theme.text} large />
        </div>
      )}

      <div
        style={{
          marginTop: '16px',
          fontSize: '14px',
          color: 'var(--muted)',
        }}
      >
        {theme.sublabel}
      </div>

      <div
        style={{
          marginTop: '12px',
          fontSize: '12px',
          color: 'var(--muted)',
          direction: 'ltr',
        }}
      >
        Checkout: {checkoutTime.toLocaleString('en-SA')}
      </div>
    </div>
  )
}

function TimeBlock({
  value,
  label,
  color,
  large = false,
}: {
  value: number
  label: string
  color: string
  large?: boolean
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontSize: large ? '72px' : '48px',
          fontWeight: 700,
          color,
          lineHeight: 1,
          fontFamily: 'Reem Kufi, sans-serif',
          minWidth: large ? '100px' : '70px',
        }}
      >
        {pad(value)}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--muted)',
          marginTop: '6px',
        }}
      >
        {label}
      </div>
    </div>
  )
}
