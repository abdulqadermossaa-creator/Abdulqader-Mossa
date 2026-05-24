'use client'

import { useEffect, useState } from 'react'
import { getTypeIcon } from '@/lib/utils'

interface WelcomeScreenProps {
  guestName?: string
  unitName: string
  unitType: string
  welcomeMessage?: string
  status: 'waiting' | 'active' | 'checkout-warning'
}

export function WelcomeScreen({
  guestName,
  unitName,
  unitType,
  welcomeMessage,
  status,
}: WelcomeScreenProps) {
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
      setDateStr(
        now.toLocaleDateString('ar-SA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  // Speak welcome message on mount if there's a guest
  useEffect(() => {
    if (guestName && welcomeMessage && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(welcomeMessage)
      utterance.lang = 'ar-SA'
      utterance.rate = 0.9
      utterance.pitch = 1.1
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        window.speechSynthesis.speak(utterance)
      }, 1500)
      return () => {
        clearTimeout(timer)
        window.speechSynthesis.cancel()
      }
    }
  }, [guestName, welcomeMessage])

  const bgOverlay =
    status === 'checkout-warning'
      ? 'radial-gradient(circle at 50% 50%, rgba(229,107,111,0.08) 0%, transparent 60%)'
      : status === 'active'
      ? 'radial-gradient(circle at 50% 50%, rgba(95,184,120,0.06) 0%, transparent 60%)'
      : 'radial-gradient(circle at 50% 50%, rgba(212,165,116,0.06) 0%, transparent 60%)'

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundImage: bgOverlay,
        transition: 'background-image 1s ease',
        textAlign: 'center',
        gap: '24px',
      }}
    >
      {/* Unit Icon */}
      <div
        style={{
          fontSize: '64px',
          marginBottom: '8px',
        }}
      >
        {getTypeIcon(unitType)}
      </div>

      {/* Unit Name */}
      <div>
        <h1
          style={{
            fontFamily: 'Reem Kufi, sans-serif',
            fontSize: '36px',
            fontWeight: 700,
            color: 'var(--accent)',
            marginBottom: '8px',
          }}
        >
          {unitName}
        </h1>

        {guestName ? (
          <div
            style={{
              fontSize: '22px',
              color: 'var(--text)',
              fontWeight: 500,
            }}
          >
            أهلاً وسهلاً، {guestName}
          </div>
        ) : (
          <div style={{ fontSize: '18px', color: 'var(--muted)' }}>
            في انتظار الضيوف
          </div>
        )}
      </div>

      {/* Welcome Message */}
      {welcomeMessage && guestName && (
        <div
          style={{
            background: 'rgba(212,165,116,0.08)',
            border: '1px solid rgba(212,165,116,0.2)',
            borderRadius: '12px',
            padding: '16px 24px',
            maxWidth: '500px',
            fontSize: '15px',
            color: 'var(--text)',
            lineHeight: 1.7,
          }}
        >
          {welcomeMessage}
        </div>
      )}

      {/* Time */}
      <div>
        <div
          style={{
            fontFamily: 'Reem Kufi, sans-serif',
            fontSize: '52px',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '0.05em',
            direction: 'ltr',
          }}
        >
          {timeStr}
        </div>
        <div
          style={{
            fontSize: '16px',
            color: 'var(--muted)',
            marginTop: '4px',
          }}
        >
          {dateStr}
        </div>
      </div>

      {/* Status indicator */}
      {status === 'waiting' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            borderRadius: '20px',
            background: 'rgba(139,148,163,0.1)',
            border: '1px solid rgba(139,148,163,0.2)',
            color: 'var(--muted)',
            fontSize: '14px',
          }}
        >
          <span className="live-dot" style={{ background: 'var(--muted)', boxShadow: 'none' }} />
          في انتظار الضيوف
        </div>
      )}
    </div>
  )
}
