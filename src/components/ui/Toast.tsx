'use client'

import { useEffect, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
}

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const borderColor = {
    success: 'var(--success)',
    error: 'var(--danger)',
    info: 'var(--info)',
    warning: 'var(--warning)',
  }[type]

  return (
    <div
      className="animate-slide-in"
      style={{
        background: 'var(--bg-elev)',
        border: `1px solid ${borderColor}`,
        borderRight: `4px solid ${borderColor}`,
        padding: '14px 22px',
        borderRadius: '10px',
        fontSize: '13.5px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        color: 'var(--text)',
        maxWidth: '360px',
        direction: 'rtl',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      {message}
    </div>
  )
}

// ── Toast Container (global) ───────────────────────────────────
let globalAddToast: ((msg: string, type?: ToastType) => void) | null = null

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message: msg, type }])
  }, [])

  useEffect(() => {
    globalAddToast = addToast
    return () => { globalAddToast = null }
  }, [addToast])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end',
      }}
    >
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>
  )
}

export function showToast(message: string, type: ToastType = 'success') {
  if (globalAddToast) {
    globalAddToast(message, type)
  }
}
