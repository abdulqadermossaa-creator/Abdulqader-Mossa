'use client'

import { useState } from 'react'

interface AccessCodeProps {
  code: string
  onCopy?: () => void
}

export function AccessCode({ code, onCopy }: AccessCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers that don't support clipboard API
      const el = document.createElement('textarea')
      el.value = code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
      }}
    >
      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
        🔑 كود الدخول
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontFamily: 'Reem Kufi, sans-serif',
            fontSize: '48px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'var(--accent)',
            direction: 'ltr',
            flex: 1,
            textAlign: 'center',
          }}
        >
          {code}
        </div>

        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(95,184,120,0.12)' : 'rgba(212,165,116,0.12)',
            border: `1px solid ${copied ? 'rgba(95,184,120,0.3)' : 'rgba(212,165,116,0.3)'}`,
            color: copied ? 'var(--success)' : 'var(--accent)',
            padding: '10px 16px',
            borderRadius: '9px',
            cursor: 'pointer',
            fontFamily: 'Tajawal, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          {copied ? '✓ تم النسخ' : 'نسخ'}
        </button>
      </div>

      <div
        style={{
          marginTop: '12px',
          fontSize: '11.5px',
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        استخدم هذا الكود لفتح باب الوحدة
      </div>
    </div>
  )
}
