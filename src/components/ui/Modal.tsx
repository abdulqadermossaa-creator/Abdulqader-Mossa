'use client'

import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '780px',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '30px 16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          maxWidth,
          width: '100%',
          padding: '28px',
          margin: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '22px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'Reem Kufi, sans-serif',
                fontSize: '20px',
                marginBottom: '4px',
                color: 'var(--text)',
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p style={{ color: 'var(--muted)', fontSize: '12.5px' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--muted)'
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
