'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase'
import type { Unit } from '@/lib/types'
import { timeUntil, formatCurrency, getTypeIcon } from '@/lib/utils'
import type { UrgencyLevel } from '@/lib/utils'
import { getUrgencyLevel } from '@/lib/utils'

const SUPPORT_OPTIONS = [
  { id: 'ac', label: '❄️ المكيف لا يعمل' },
  { id: 'wifi', label: '📶 مشكلة في الإنترنت' },
  { id: 'lock', label: '🔒 مشكلة في القفل' },
  { id: 'hot_water', label: '🚿 الماء الساخن' },
  { id: 'tv', label: '📺 التلفاز' },
  { id: 'cleanliness', label: '🧹 طلب تنظيف' },
  { id: 'extension', label: '⏱️ تمديد المدة' },
  { id: 'other', label: '💬 أخرى' },
]

function urgencyColors(level: UrgencyLevel): { bg: string; border: string; text: string; headerBg: string } {
  switch (level) {
    case 'urgent':  return { bg: 'rgba(229,107,111,0.08)', border: 'rgba(229,107,111,0.4)', text: '#e56b6f', headerBg: 'rgba(229,107,111,0.15)' }
    case 'danger':  return { bg: 'rgba(229,107,111,0.05)', border: 'rgba(229,107,111,0.25)', text: '#e56b6f', headerBg: 'rgba(229,107,111,0.1)' }
    case 'warning': return { bg: 'rgba(240,198,116,0.06)', border: 'rgba(240,198,116,0.3)', text: '#f0c674', headerBg: 'rgba(240,198,116,0.12)' }
    default:        return { bg: 'rgba(95,184,120,0.05)', border: 'rgba(95,184,120,0.25)', text: '#5fb878', headerBg: 'rgba(95,184,120,0.1)' }
  }
}

export default function GuestPage({ params }: { params: Promise<{ unit_id: string }> }) {
  const { unit_id } = use(params)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 })
  const [urgency, setUrgency] = useState<UrgencyLevel>('safe')
  const [wifiVisible, setWifiVisible] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [wifiCopied, setWifiCopied] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportIssue, setSupportIssue] = useState('')
  const [supportSent, setSupportSent] = useState(false)
  const [speechDone, setSpeechDone] = useState(false)
  const [now, setNow] = useState(new Date())

  const loadUnit = useCallback(async () => {
    const { data } = await supabase.from('units').select('*').eq('id', unit_id).single()
    if (data) {
      setUnit(data as Unit)
      if (!speechDone && data.current_guest_name) {
        playWelcome(data.welcome_message ?? `أهلاً بك في ${data.name}`)
        setSpeechDone(true)
      }
    }
    setLoading(false)
  }, [unit_id, speechDone])

  useEffect(() => {
    loadUnit()
    const channel = supabase
      .channel('guest-unit')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'units', filter: `id=eq.${unit_id}` }, payload => {
        setUnit(payload.new as Unit)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadUnit, unit_id])

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Countdown
  useEffect(() => {
    if (!unit?.checkout_time) return
    const t = setInterval(() => {
      const dur = timeUntil(new Date(unit.checkout_time!))
      setCountdown(dur)
      setUrgency(getUrgencyLevel(dur.total))
    }, 1000)
    return () => clearInterval(t)
  }, [unit?.checkout_time])

  function playWelcome(msg: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(msg)
    u.lang = 'ar-SA'; u.rate = 0.9; u.pitch = 1
    window.speechSynthesis.speak(u)
  }

  function copyToClipboard(text: string, which: 'code' | 'wifi') {
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'code') { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000) }
      else { setWifiCopied(true); setTimeout(() => setWifiCopied(false), 2000) }
    })
  }

  async function sendSupport() {
    if (!supportIssue) return
    await supabase.from('activity_logs').insert({ unit_id, event_type: 'SUPPORT_REQUEST', details: { issue: supportIssue } })
    setSupportSent(true)
    setTimeout(() => { setSupportOpen(false); setSupportSent(false); setSupportIssue('') }, 2500)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0e1116', fontFamily: 'Tajawal' }}>
      <div style={{ textAlign: 'center', color: '#8b94a3' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⌛</div>
        <div>جارٍ التحميل…</div>
      </div>
    </div>
  )

  if (!unit) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0e1116', fontFamily: 'Tajawal' }}>
      <div style={{ textAlign: 'center', color: '#8b94a3' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🏚️</div>
        <div style={{ fontFamily: 'Reem Kufi', fontSize: 20, marginBottom: 8, color: '#e8eaed' }}>الوحدة غير موجودة</div>
        <div>تحقق من الرابط أو تواصل مع المضيف</div>
      </div>
    </div>
  )

  const uc = urgencyColors(urgency)

  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ minHeight: '100vh', background: '#0e1116', color: '#e8eaed', fontFamily: 'Tajawal, sans-serif', backgroundImage: 'radial-gradient(circle at 20% 10%,rgba(212,165,116,0.06) 0%,transparent 40%),radial-gradient(circle at 80% 90%,rgba(212,165,116,0.04) 0%,transparent 40%)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: 9, display: 'grid', placeItems: 'center', fontFamily: 'Reem Kufi', fontWeight: 700, color: '#0e1116', fontSize: 16 }}>Q</div>
            <span style={{ fontFamily: 'Reem Kufi', fontSize: 20, fontWeight: 600 }}>Qlivn OS</span>
          </div>
          <div style={{ fontSize: 12, color: '#8b94a3' }}>{timeStr} · {dateStr}</div>
        </div>

        {/* ── Welcome card ── */}
        <div style={{ background: 'linear-gradient(135deg,rgba(212,165,116,0.12),rgba(212,165,116,0.04))', border: '1px solid rgba(212,165,116,0.25)', borderRadius: 20, padding: '24px 20px', textAlign: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{getTypeIcon(unit.type)}</div>
          <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 22, marginBottom: 6, color: '#d4a574' }}>{unit.name}</h1>
          {unit.current_guest_name && <p style={{ fontSize: 16, marginBottom: 4 }}>أهلاً بك يا <strong>{unit.current_guest_name}</strong> 👋</p>}
          <p style={{ fontSize: 13, color: '#8b94a3' }}>{unit.welcome_message ?? 'نتمنى لك إقامة سعيدة ومريحة'}</p>
          {unit.location && <div style={{ marginTop: 12, fontSize: 12, color: '#8b94a3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>📍 {unit.location}</div>}
        </div>

        {/* ── Countdown ── */}
        {unit.checkout_time && (
          <div style={{ background: uc.bg, border: `1px solid ${uc.border}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden', animation: urgency === 'urgent' ? 'countdown-pulse 1s infinite' : undefined }}>
            <div style={{ padding: '12px 16px', background: uc.headerBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>⏱️ وقت المغادرة</span>
              <span style={{ fontSize: 12, color: '#8b94a3' }}>
                {new Date(unit.checkout_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Reem Kufi', fontSize: 42, fontWeight: 700, color: uc.text, letterSpacing: -1 }}>
                {String(countdown.hours).padStart(2,'0')}:{String(countdown.minutes).padStart(2,'0')}:{String(countdown.seconds).padStart(2,'0')}
              </div>
              <div style={{ fontSize: 12, color: '#8b94a3', marginTop: 6 }}>
                {urgency === 'urgent' ? '⚠️ حان وقت المغادرة قريباً جداً' : urgency === 'danger' ? '⚠️ باقي أقل من ساعة' : urgency === 'warning' ? 'تبقّى ساعتان — يمكنك التمديد' : 'متبقي على المغادرة'}
              </div>
              {urgency !== 'safe' && (
                <button onClick={() => { setSupportIssue('extension'); setSupportOpen(true) }} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 20, background: `${uc.text}18`, border: `1px solid ${uc.border}`, color: uc.text, fontSize: 13, cursor: 'pointer', fontFamily: 'Tajawal' }}>
                  ⏱️ طلب تمديد
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Access Code ── */}
        {unit.access_code && (
          <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#8b94a3', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>🔑 كود الدخول</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Reem Kufi', fontSize: 36, fontWeight: 700, letterSpacing: 8, color: '#d4a574' }}>{unit.access_code}</div>
              <button onClick={() => copyToClipboard(unit.access_code!, 'code')} style={{ padding: '8px 16px', borderRadius: 10, background: codeCopied ? 'rgba(95,184,120,0.15)' : 'rgba(212,165,116,0.1)', border: `1px solid ${codeCopied ? 'rgba(95,184,120,0.3)' : 'rgba(212,165,116,0.25)'}`, color: codeCopied ? '#5fb878' : '#d4a574', fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
                {codeCopied ? '✓ نُسخ' : '📋 نسخ'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#8b94a3', marginTop: 6 }}>أدخل هذا الكود على لوحة الباب الذكي</div>
          </div>
        )}

        {/* ── WiFi ── */}
        {unit.wifi_password && (
          <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 16, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#8b94a3', marginBottom: 8 }}>📶 كلمة مرور الإنترنت</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#e8eaed', letterSpacing: 2, flex: 1 }}>
                {wifiVisible ? unit.wifi_password : '•'.repeat(unit.wifi_password.length)}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setWifiVisible(v => !v)} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(110,181,255,0.1)', border: '1px solid rgba(110,181,255,0.25)', color: '#6eb5ff', fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal' }}>
                  {wifiVisible ? '🙈' : '👁️'}
                </button>
                <button onClick={() => copyToClipboard(unit.wifi_password!, 'wifi')} style={{ padding: '8px 12px', borderRadius: 10, background: wifiCopied ? 'rgba(95,184,120,0.15)' : 'rgba(212,165,116,0.1)', border: `1px solid ${wifiCopied ? 'rgba(95,184,120,0.3)' : 'rgba(212,165,116,0.25)'}`, color: wifiCopied ? '#5fb878' : '#d4a574', fontSize: 12, cursor: 'pointer', fontFamily: 'Tajawal' }}>
                  {wifiCopied ? '✓' : '📋'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Info ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { icon: '🏠', label: 'نوع الوحدة', value: unit.type === 'villa' ? 'فيلا' : unit.type === 'chalet' ? 'شاليه' : 'شقة' },
            { icon: '📍', label: 'الموقع', value: unit.location ?? '—' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#8b94a3', marginBottom: 4 }}>{item.icon} {item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* ── Support Button ── */}
        <button onClick={() => setSupportOpen(true)} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(212,165,116,0.08)', border: '1px solid rgba(212,165,116,0.2)', color: '#d4a574', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, transition: 'all 0.2s' }}>
          💬 تواصل معنا — نحن هنا لمساعدتك
        </button>

        {/* ── Footer ── */}
        <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #2a3142' }}>
          <div style={{ fontSize: 11, color: '#8b94a3' }}>Qlivn OS · نظام إدارة العقارات الذكي</div>
        </div>
      </div>

      {/* ── Support Modal ── */}
      {supportOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setSupportOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0 0' }}>
          <div style={{ background: '#161a22', border: '1px solid #2a3142', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            {supportSent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 20, marginBottom: 8, color: '#5fb878' }}>تم إرسال طلبك!</h3>
                <p style={{ color: '#8b94a3', fontSize: 14 }}>سيتواصل معك فريقنا في أقرب وقت ممكن</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 18 }}>كيف يمكننا مساعدتك؟</h3>
                  <button onClick={() => setSupportOpen(false)} style={{ background: 'transparent', border: '1px solid #2a3142', color: '#8b94a3', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
                <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                  {SUPPORT_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setSupportIssue(opt.id === supportIssue ? '' : opt.id)} style={{ padding: '12px 16px', borderRadius: 12, background: supportIssue === opt.id ? 'rgba(212,165,116,0.12)' : '#1c2230', border: `1px solid ${supportIssue === opt.id ? 'rgba(212,165,116,0.4)' : '#2a3142'}`, color: supportIssue === opt.id ? '#d4a574' : '#e8eaed', fontSize: 14, textAlign: 'right', cursor: 'pointer', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button onClick={sendSupport} disabled={!supportIssue} style={{ width: '100%', padding: 14, borderRadius: 12, background: supportIssue ? '#d4a574' : '#2a3142', color: supportIssue ? '#0e1116' : '#8b94a3', fontSize: 15, fontWeight: 600, cursor: supportIssue ? 'pointer' : 'not-allowed', border: 'none', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
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
