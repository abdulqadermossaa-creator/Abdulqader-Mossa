'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase'
import type { Unit } from '@/lib/types'
import { timeUntil, getTypeIcon } from '@/lib/utils'
import type { UrgencyLevel } from '@/lib/utils'
import { getUrgencyLevel } from '@/lib/utils'

const SUPPORT_OPTIONS = [
  { id: 'ac', label: '❄️ المكيف' },
  { id: 'wifi', label: '📶 الإنترنت' },
  { id: 'lock', label: '🔒 القفل' },
  { id: 'hot_water', label: '🚿 الماء الساخن' },
  { id: 'tv', label: '📺 التلفاز' },
  { id: 'cleanliness', label: '🧹 تنظيف' },
  { id: 'extension', label: '⏱️ تمديد' },
  { id: 'other', label: '💬 أخرى' },
]

function getBg(level: UrgencyLevel): string {
  switch (level) {
    case 'urgent':  return 'radial-gradient(circle at center, #2a0a0b 0%, #0e1116 100%)'
    case 'danger':  return 'radial-gradient(circle at 30% 70%, rgba(229,107,111,0.12) 0%, #0e1116 60%)'
    case 'warning': return 'radial-gradient(circle at 30% 70%, rgba(240,198,116,0.1) 0%, #0e1116 60%)'
    default:        return 'radial-gradient(circle at 20% 10%,rgba(212,165,116,0.06) 0%,transparent 40%),radial-gradient(circle at 80% 90%,rgba(212,165,116,0.04) 0%,transparent 40%)'
  }
}
function getTimerColor(level: UrgencyLevel): string {
  switch (level) {
    case 'urgent':  return '#e56b6f'
    case 'danger':  return '#e56b6f'
    case 'warning': return '#f0c674'
    default:        return '#d4a574'
  }
}

export default function TabletPage({ params }: { params: Promise<{ unit_id: string }> }) {
  const { unit_id } = use(params)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 })
  const [urgency, setUrgency] = useState<UrgencyLevel>('safe')
  const [now, setNow] = useState(new Date())
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportIssue, setSupportIssue] = useState('')
  const [supportSent, setSupportSent] = useState(false)
  const [speechDone, setSpeechDone] = useState(false)

  const loadUnit = useCallback(async () => {
    const { data } = await supabase.from('units').select('*').eq('id', unit_id).single()
    if (data) {
      setUnit(data as Unit)
      if (!speechDone && data.current_guest_name) {
        setTimeout(() => {
          const msg = data.welcome_message ?? `أهلاً وسهلاً يا ${data.current_guest_name} في ${data.name}، نتمنى لك إقامة سعيدة`
          const u = new SpeechSynthesisUtterance(msg)
          u.lang = 'ar-SA'; u.rate = 0.85; u.pitch = 1.05; u.volume = 1
          window.speechSynthesis?.speak(u)
          setSpeechDone(true)
        }, 1000)
      }
    }
    setLoading(false)
  }, [unit_id, speechDone])

  useEffect(() => {
    loadUnit()
    const ch = supabase.channel('tablet-unit')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'units', filter: `id=eq.${unit_id}` }, payload => {
        setUnit(payload.new as Unit)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadUnit, unit_id])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!unit?.checkout_time) return
    const t = setInterval(() => {
      const dur = timeUntil(new Date(unit.checkout_time!))
      setCountdown(dur)
      setUrgency(getUrgencyLevel(dur.total))
    }, 1000)
    return () => clearInterval(t)
  }, [unit?.checkout_time])

  async function sendSupport() {
    if (!supportIssue) return
    await supabase.from('activity_logs').insert({ unit_id, event_type: 'SUPPORT_REQUEST', details: { issue: supportIssue, source: 'tablet' } })
    setSupportSent(true)
    setTimeout(() => { setSupportOpen(false); setSupportSent(false); setSupportIssue('') }, 3000)
  }

  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timerColor = getTimerColor(urgency)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0e1116', fontFamily: 'Tajawal' }}>
      <div style={{ textAlign: 'center', color: '#8b94a3' }}>
        <div style={{ fontFamily: 'Reem Kufi', fontSize: 48, color: '#d4a574', marginBottom: 16 }}>Qlivn</div>
        <div>جارٍ التهيئة…</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: getBg(urgency), color: '#e8eaed', fontFamily: 'Tajawal, sans-serif', display: 'flex', flexDirection: 'column', transition: 'background 1s ease', userSelect: 'none' }}>

      {/* ── Top Bar ── */}
      <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: 11, display: 'grid', placeItems: 'center', fontFamily: 'Reem Kufi', fontWeight: 700, color: '#0e1116', fontSize: 20 }}>Q</div>
          <div>
            <div style={{ fontFamily: 'Reem Kufi', fontSize: 18, fontWeight: 600 }}>Qlivn OS</div>
            <div style={{ fontSize: 11, color: '#8b94a3' }}>{unit?.location ?? 'Smart Stay'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 700, letterSpacing: -1, color: '#e8eaed' }}>{timeStr}</div>
          <div style={{ fontSize: 12, color: '#8b94a3', textAlign: 'right' }}>{dateStr}</div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 24 }}>

        {/* Welcome */}
        {unit && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{getTypeIcon(unit.type)}</div>
            <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 36, fontWeight: 700, marginBottom: 8, color: '#d4a574' }}>{unit.name}</h1>
            {unit.current_guest_name ? (
              <p style={{ fontSize: 22, color: '#e8eaed' }}>أهلاً بك يا <span style={{ color: '#d4a574', fontWeight: 700 }}>{unit.current_guest_name}</span> 👋</p>
            ) : (
              <p style={{ fontSize: 20, color: '#8b94a3' }}>مرحباً بكم في Qlivn</p>
            )}
          </div>
        )}

        {/* Countdown */}
        {unit?.checkout_time && (
          <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${timerColor}33`, borderRadius: 24, padding: '32px 48px', minWidth: 360, backdropFilter: 'blur(8px)', animation: urgency === 'urgent' ? 'countdown-pulse 1s infinite' : undefined }}>
            <div style={{ fontSize: 12, color: '#8b94a3', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>
              {urgency === 'urgent' ? '⚠️ وقت المغادرة الآن' : urgency === 'danger' ? '⚠️ باقي أقل من ساعة' : urgency === 'warning' ? '⏰ تبقّى ساعتان' : '⏱️ وقت المغادرة المتبقي'}
            </div>
            <div style={{ fontFamily: 'Reem Kufi', fontSize: 72, fontWeight: 700, color: timerColor, letterSpacing: -2, lineHeight: 1, transition: 'color 1s ease' }}>
              {String(countdown.hours).padStart(2,'0')}:{String(countdown.minutes).padStart(2,'0')}:{String(countdown.seconds).padStart(2,'0')}
            </div>
            <div style={{ fontSize: 13, color: '#8b94a3', marginTop: 8 }}>
              موعد المغادرة: {new Date(unit.checkout_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {/* Access Code */}
        {unit?.access_code && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(212,165,116,0.2)', borderRadius: 16, padding: '16px 28px', backdropFilter: 'blur(6px)' }}>
            <span style={{ fontSize: 20 }}>🔑</span>
            <div>
              <div style={{ fontSize: 11, color: '#8b94a3', marginBottom: 2 }}>كود الدخول</div>
              <div style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 700, letterSpacing: 6, color: '#d4a574' }}>{unit.access_code}</div>
            </div>
          </div>
        )}

        {/* WiFi */}
        {unit?.wifi_password && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(110,181,255,0.15)', borderRadius: 16, padding: '14px 24px', backdropFilter: 'blur(6px)' }}>
            <span style={{ fontSize: 20 }}>📶</span>
            <div>
              <div style={{ fontSize: 11, color: '#8b94a3', marginBottom: 2 }}>كلمة مرور Wi-Fi</div>
              <div style={{ fontFamily: 'monospace', fontSize: 22, letterSpacing: 2, color: '#6eb5ff' }}>{unit.wifi_password}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Bar ── */}
      <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {urgency !== 'safe' && (
            <button onClick={() => { setSupportIssue('extension'); setSupportOpen(true) }} style={{ padding: '12px 20px', borderRadius: 12, background: `${timerColor}18`, border: `1px solid ${timerColor}44`, color: timerColor, fontSize: 14, cursor: 'pointer', fontFamily: 'Tajawal', fontWeight: 600 }}>
              ⏱️ طلب تمديد
            </button>
          )}
        </div>
        <button onClick={() => setSupportOpen(true)} style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(212,165,116,0.1)', border: '1px solid rgba(212,165,116,0.25)', color: '#d4a574', fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          💬 تواصل مع الدعم
        </button>
      </div>

      {/* ── Support Modal ── */}
      {supportOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setSupportOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#161a22', border: '1px solid #2a3142', borderRadius: 24, width: '100%', maxWidth: 500, padding: 32 }}>
            {supportSent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 24, marginBottom: 10, color: '#5fb878' }}>تم إرسال طلبك!</h3>
                <p style={{ color: '#8b94a3', fontSize: 15 }}>سيتواصل معك فريقنا فوراً</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 22 }}>كيف يمكننا مساعدتك؟</h3>
                  <button onClick={() => setSupportOpen(false)} style={{ background: 'transparent', border: '1px solid #2a3142', color: '#8b94a3', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  {SUPPORT_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setSupportIssue(opt.id === supportIssue ? '' : opt.id)} style={{ padding: '14px', borderRadius: 12, background: supportIssue === opt.id ? 'rgba(212,165,116,0.15)' : '#1c2230', border: `1px solid ${supportIssue === opt.id ? 'rgba(212,165,116,0.4)' : '#2a3142'}`, color: supportIssue === opt.id ? '#d4a574' : '#e8eaed', fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button onClick={sendSupport} disabled={!supportIssue} style={{ width: '100%', padding: 16, borderRadius: 14, background: supportIssue ? '#d4a574' : '#2a3142', color: supportIssue ? '#0e1116' : '#8b94a3', fontSize: 16, fontWeight: 700, cursor: supportIssue ? 'pointer' : 'not-allowed', border: 'none', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
                  إرسال الطلب
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
