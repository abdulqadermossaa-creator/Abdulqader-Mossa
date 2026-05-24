'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Host, EventEntry } from '@/lib/types'
import { EVENTS_META } from '@/lib/types'
import { getTypeLabel, getTypeIcon, getStatusLabel } from '@/lib/utils'

// ── Default module config ──────────────────────────────────────
const DEFAULT_MODULES = {
  sports:   { enabled: false, leagues: [] as string[], match_day_only: false },
  music:    { enabled: false, genre: 'arabic', auto_on: false },
  lighting: { enabled: false, scene: 'warm', auto_dim: true },
  tv:       { enabled: false, default_ch: 'MBC' },
  presence: { enabled: true,  sensitivity: 'medium' as const },
  ai:       { enabled: false, personality: 'friendly' as const },
}

const LEAGUES = [
  { id: 'saudi', label: 'دوري روشن' },
  { id: 'premier', label: 'الإنجليزي' },
  { id: 'champions', label: 'Champions' },
  { id: 'laliga', label: 'La Liga' },
  { id: 'bundesliga', label: 'Bundesliga' },
]
const MUSIC_GENRES = [
  { id: 'arabic', label: 'عربي' },
  { id: 'khaliji', label: 'خليجي' },
  { id: 'lounge', label: 'Lounge' },
  { id: 'classical', label: 'كلاسيك' },
  { id: 'quran', label: 'قرآن' },
]
const LIGHTING_SCENES = [
  { id: 'warm', label: 'دافئ' },
  { id: 'cool', label: 'بارد' },
  { id: 'bright', label: 'مضيء' },
  { id: 'dim', label: 'خافت' },
  { id: 'cinematic', label: 'سينما' },
]
const DEFAULT_AUTOMATIONS = [
  { trigger: 'BOOKING_CREATED',  actions: ['إرسال رابط الضيف', 'إنشاء كود الدخول'] },
  { trigger: 'CHECKIN_STARTED',  actions: ['تشغيل ترحيب صوتي', 'رفع الإضاءة 100%', 'تشغيل موسيقى'] },
  { trigger: 'GUEST_ENTERED',    actions: ['تسجيل وقت الدخول', 'بدء العد التنازلي'] },
  { trigger: 'CHECKOUT_SOON',    actions: ['إشعار الضيف', 'خلفية تحذيرية'] },
  { trigger: 'PROPERTY_EMPTY',   actions: ['إيقاف كل الأجهزة', 'طلب تنظيف', 'إعادة تعيين الكود'] },
  { trigger: 'CLEANING_REQUIRED',actions: ['إشعار عامل النظافة', 'تحديث الحالة'] },
]

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div
      style={{
        position: 'fixed', bottom: 30, right: 30,
        background: 'var(--bg-elev)', border: '1px solid var(--success)',
        borderRight: '4px solid var(--success)', padding: '14px 22px',
        borderRadius: 10, fontSize: 13.5, zIndex: 300,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        transition: 'opacity 0.3s', opacity: show ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      {msg}
    </div>
  )
}

export default function HostPage() {
  const [page, setPage] = useState<'layer' | 'hosts' | 'events'>('layer')
  const [hosts, setHosts] = useState<Host[]>([])
  const [events, setEvents] = useState<EventEntry[]>([])
  const [toast, setToast] = useState({ show: false, msg: '' })
  const [addOpen, setAddOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [configHost, setConfigHost] = useState<Host | null>(null)
  const [configTab, setConfigTab] = useState<'info' | 'modules' | 'auto'>('info')
  const [autoMap, setAutoMap] = useState<Record<string, boolean>>({})

  // form state
  const [formName, setFormName] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formType, setFormType] = useState<'villa' | 'apartment' | 'chalet'>('apartment')
  const [formStatus, setFormStatus] = useState<'active' | 'inactive' | 'maintenance'>('active')
  const [formWelcome, setFormWelcome] = useState('')

  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast({ show: false, msg: '' }), 3000)
  }

  const loadHosts = useCallback(async () => {
    const { data } = await supabase.from('hosts').select('*').order('created_at')
    if (data) setHosts(data as Host[])
  }, [])

  useEffect(() => {
    loadHosts()
    const channel = supabase
      .channel('hosts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hosts' }, loadHosts)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadHosts])

  function fireEvent(type: string) {
    const meta = EVENTS_META[type]
    if (!meta) return
    const host = hosts.length > 0 ? hosts[Math.floor(Math.random() * hosts.length)].name : 'النظام'
    const now = new Date()
    const entry: EventEntry = {
      type,
      meta,
      host,
      time: now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ts: now.getTime(),
    }
    setEvents(prev => [entry, ...prev.slice(0, 49)])
    setPage('events')
  }

  async function saveHost() {
    if (!formName.trim()) { showToast('أدخل اسم المضيف'); return }
    const { error } = await supabase.from('hosts').insert({
      name: formName, location: formLocation, type: formType,
      status: formStatus, welcome_message: formWelcome,
      config: { modules: DEFAULT_MODULES },
    })
    if (error) { showToast('حدث خطأ'); return }
    showToast('تم إضافة المضيف بنجاح ✓')
    setAddOpen(false)
    setFormName(''); setFormLocation(''); setFormWelcome('')
  }

  function openConfig(h: Host) {
    setConfigHost(h)
    setConfigTab('info')
    const map: Record<string, boolean> = {}
    DEFAULT_AUTOMATIONS.forEach((a, i) => { map[`${a.trigger}-${i}`] = true })
    setAutoMap(map)
    setConfigOpen(true)
  }

  async function saveHostConfig() {
    if (!configHost) return
    const { error } = await supabase.from('hosts').update({
      name: configHost.name,
      location: configHost.location,
      type: configHost.type,
      status: configHost.status,
      welcome_message: configHost.welcome_message,
      config: configHost.config,
    }).eq('id', configHost.id)
    if (error) { showToast('حدث خطأ'); return }
    showToast('تم حفظ الإعدادات ✓')
    setConfigOpen(false)
  }

  async function deleteHost() {
    if (!configHost) return
    if (!confirm(`حذف "${configHost.name}"؟`)) return
    await supabase.from('hosts').delete().eq('id', configHost.id)
    showToast('تم الحذف')
    setConfigOpen(false)
  }

  const modules = (configHost?.config?.modules ?? {}) as typeof DEFAULT_MODULES

  const activeCount = hosts.filter(h => h.status === 'active').length
  const moduleCount = hosts.reduce((acc, h) => {
    const m = (h.config?.modules ?? {}) as typeof DEFAULT_MODULES
    return acc + Object.values(m).filter((v: { enabled?: boolean }) => v?.enabled).length
  }, 0)

  const s = (cls: string) => ({
    booking: '#6eb5ff', checkin: '#5fb878', guest: '#d4a574',
    checkout: '#f0c674', empty: '#8b94a3', cleaning: '#e56b6f',
  }[cls.replace('e-', '')] ?? '#8b94a3')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Tajawal, sans-serif' }}>
      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(14,17,22,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: 10, display: 'grid', placeItems: 'center', fontFamily: 'Reem Kufi', fontWeight: 700, color: '#0e1116', fontSize: 18 }}>Q</div>
            <div>
              <div style={{ fontFamily: 'Reem Kufi', fontSize: 18, fontWeight: 600 }}>Qlivn OS</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Host Layer · طبقة المضيفين</div>
            </div>
          </div>
          <nav>
            <ul style={{ display: 'flex', listStyle: 'none', gap: 4, flexWrap: 'wrap' }}>
              {([['layer','🏗️ البنية'],['hosts','🏠 المضيفون'],['events','⚡ الأحداث']] as const).map(([id,label]) => (
                <li key={id}>
                  <button onClick={() => setPage(id)} style={{ padding: '7px 13px', color: page === id ? 'var(--accent)' : 'var(--muted)', background: page === id ? 'rgba(212,165,116,0.1)' : 'transparent', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Tajawal' }}>{label}</button>
                </li>
              ))}
            </ul>
          </nav>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href="/founder" style={{ padding: '7px 13px', color: 'var(--muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, textDecoration: 'none' }}>📊 المؤسس</a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: 28 }}>

        {/* ══ PAGE: LAYER ══ */}
        {page === 'layer' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 30, fontWeight: 600, marginBottom: 5, letterSpacing: -0.5 }}>بنية النظام</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>كيف تتدفق المعلومات من الأجهزة وحتى تجربة الضيف — كل طبقة مستقلة وقابلة للتطوير</p>
            </div>

            <SectionTitle>تدفق الطبقات</SectionTitle>
            <div style={{ display: 'flex', overflowX: 'auto', marginBottom: 32, borderRadius: 14, border: '1px solid var(--border)' }}>
              {[
                { icon: '🔌', title: 'Device Layer', desc: 'Zigbee2MQTT\nحساسات · أجهزة ذكية' },
                { icon: '📡', title: 'Local Agent', desc: 'QLIVN Agent\nيجمع الأحداث محلياً' },
                { icon: '⚡', title: 'Event Bus', desc: 'الأحداث تتدفق هنا\n6 أحداث رئيسية', highlight: true },
                { icon: '🧠', title: 'State Engine', desc: 'حالة العقار\nوالضيف والأجهزة' },
                { icon: '🔗', title: 'Automation Graph', desc: 'متى يحصل إيش\nلكل مضيف مستقل' },
                { icon: '🤖', title: 'AI Layer', desc: 'تخصيص التجربة\nتعلم تفضيلات الضيف' },
                { icon: '✨', title: 'Experience', desc: 'ما يشوفه الضيف\nويحسه في العقار', highlight: true },
              ].map((n, i) => (
                <div key={i} style={{ flex: '1 1 140px', minWidth: 140, padding: '18px 16px', background: n.highlight ? 'rgba(212,165,116,0.06)' : 'var(--bg-card)', borderLeft: i > 0 ? '1px solid var(--border)' : 'none', textAlign: 'center', borderColor: n.highlight ? 'rgba(212,165,116,0.4)' : undefined }}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{n.icon}</div>
                  <div style={{ fontFamily: 'Reem Kufi', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{n.desc}</div>
                </div>
              ))}
            </div>

            <SectionTitle>أحداث Event Bus</SectionTitle>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>كل حدث يُطلق سلسلة أتمتة مختلفة لكل مضيف حسب إعداداته</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
              {Object.entries(EVENTS_META).map(([type, meta]) => (
                <button key={type} onClick={() => fireEvent(type)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${s(meta.cls)}33`, background: `${s(meta.cls)}18`, color: s(meta.cls), cursor: 'pointer', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
                  {meta.icon} {type}
                </button>
              ))}
            </div>

            <SectionTitle>مبادئ التصميم</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { icon: '🧩', title: 'Plug and Play', body: 'كل مضيف يُضاف من الداشبورد بضغطة زر. لا تغيير في الكود. كل شيء يشتغل تلقائياً من اللحظة الأولى.', items: ['نموذج واحد لإضافة أي مضيف', 'إعدادات افتراضية ذكية', 'تفعيل فوري بدون إعادة تشغيل'] },
                { icon: '🔧', title: 'Feature Modules', body: 'كل ميزة معزولة في module مستقل. تفعّله أو توقفه لأي مضيف دون أن يأثر على الباقين.', items: ['🏆 Sports: دوري السعودية، أوروبا', '🎵 Music: النوع، التوقيت', '💡 Lighting: مشاهد، تعتيم تلقائي', '🤖 AI: شخصية، لغة، تفضيلات'] },
                { icon: '⚙️', title: 'Per-Host Config', body: 'مضيف A يريد مباريات دوري السعودية فقط. مضيف B لا يريد رياضة أصلاً. كل واحد مستقل تماماً.', items: ['JSON config لكل مضيف', 'يُحفظ في Supabase', 'يُحمّل عند أي حدث'] },
                { icon: '📊', title: 'Supabase Backend', body: 'Auth · Database · Realtime · Storage كلهم جاهزين. ما تحتاج تبني backend من الصفر.', items: ['hosts table', 'events_log table', 'automations table'] },
                { icon: '🔄', title: 'Automation Graph', body: 'كل حدث → قائمة أتمتة. كل مضيف يحدد أي أتمتة تشتغل عنده. التعديل من الداشبورد.', items: ['CHECKIN_STARTED → welcome routine', 'PROPERTY_EMPTY → reset all', 'CHECKOUT_SOON → reminders'] },
                { icon: '🌐', title: 'Booking Sources', body: 'Airbnb · Gathern · مباشر. كل مصدر يُرسل BOOKING_CREATED للـ Event Bus والنظام يكمل وحده.', items: ['iCal sync كل 15 دقيقة', 'توحيد البيانات', 'State Engine يتحدث تلقائياً'] },
              ].map((c, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                  <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 15, marginBottom: 6 }}>{c.title}</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}>{c.body}</p>
                  <ul style={{ paddingRight: 16 }}>
                    {c.items.map((it, j) => <li key={j} style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{it}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            <SectionTitle>مخطط قاعدة البيانات</SectionTitle>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, fontFamily: 'monospace', fontSize: 12.5, color: 'var(--muted)', lineHeight: 2, overflowX: 'auto' }}>
              <span style={{ color: 'var(--accent)' }}>hosts</span> (id, name, location, type, status, <span style={{ color: 'var(--info)' }}>config JSON</span>, created_at)<br />
              <span style={{ color: 'var(--accent)' }}>units</span> (id, name, location, current_guest_name, checkout_time, access_code, wifi_password)<br />
              <span style={{ color: 'var(--accent)' }}>bookings</span> (id, unit_id, guest_name, checkin, checkout, source, status)<br />
              <span style={{ color: 'var(--accent)' }}>events_log</span> (id, host_id, event_type, payload JSON, triggered_at)<br />
              <span style={{ color: 'var(--accent)' }}>automations</span> (id, host_id, trigger_event, actions JSON, is_active)
            </div>
          </div>
        )}

        {/* ══ PAGE: HOSTS ══ */}
        {page === 'hosts' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 30, fontWeight: 600, marginBottom: 5 }}>المضيفون</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>سجل المضيفين — أضف مضيف جديد وهيّئ modules بضغطة زر</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'إجمالي المضيفين', value: hosts.length, trend: 'مسجلون في النظام' },
                { label: 'نشط', value: activeCount, trend: 'يعمل الآن', up: true },
                { label: 'Modules مفعّلة', value: moduleCount, trend: 'عبر كل المضيفين' },
                { label: 'أحداث اليوم', value: events.length, trend: 'في Event Bus' },
              ].map((st, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle,rgba(212,165,116,0.08),transparent 70%)' }} />
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{st.label}</div>
                  <div style={{ fontFamily: 'Reem Kufi', fontSize: 28, fontWeight: 600 }}>{st.value}</div>
                  <div style={{ fontSize: 11, color: st.up ? 'var(--success)' : 'var(--muted)', marginTop: 4 }}>{st.trend}</div>
                </div>
              ))}
            </div>

            <SectionTitle>سجل المضيفين</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16, marginBottom: 28 }}>
              {hosts.map(h => {
                const m = (h.config?.modules ?? {}) as typeof DEFAULT_MODULES
                const modulePips = [
                  { key: 'sports', label: '🏆', on: m.sports?.enabled },
                  { key: 'music', label: '🎵', on: m.music?.enabled },
                  { key: 'lighting', label: '💡', on: m.lighting?.enabled },
                  { key: 'tv', label: '📺', on: m.tv?.enabled },
                  { key: 'presence', label: '👁️', on: m.presence?.enabled },
                  { key: 'ai', label: '🤖', on: m.ai?.enabled },
                ]
                return (
                  <div key={h.id} onClick={() => openConfig(h)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.25s', position: 'relative', overflow: 'hidden' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(212,165,116,0.12)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{getTypeIcon(h.type)}</div>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: h.status === 'active' ? 'rgba(95,184,120,0.12)' : h.status === 'maintenance' ? 'rgba(240,198,116,0.12)' : 'rgba(139,148,163,0.12)', color: h.status === 'active' ? 'var(--success)' : h.status === 'maintenance' ? 'var(--warning)' : 'var(--muted)' }}>{getStatusLabel(h.status)}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 3 }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>{h.location ?? '—'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {modulePips.map(p => (
                        <span key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 11, border: '1px solid', opacity: p.on ? 1 : 0.4, background: p.on ? 'rgba(95,184,120,0.12)' : 'transparent', color: p.on ? 'var(--success)' : 'var(--muted)', borderColor: p.on ? 'rgba(95,184,120,0.3)' : 'var(--border)' }}>
                          {p.label} {p.key}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12 }}>
                      <span>{getTypeLabel(h.type)}</span>
                      <span style={{ color: 'var(--muted)' }}>اضغط للإعداد ←</span>
                    </div>
                  </div>
                )
              })}

              {/* Add Host card */}
              <div onClick={() => setAddOpen(true)} style={{ background: 'var(--bg-card)', border: '2px dashed var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 200, transition: 'all 0.25s', color: 'var(--muted)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.color = 'var(--accent)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.color = 'var(--muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.6 }}>＋</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>إضافة مضيف جديد</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Plug and Play — يشتغل فوراً</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ PAGE: EVENTS ══ */}
        {page === 'events' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 30, fontWeight: 600, marginBottom: 5 }}>Event Bus</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>مراقبة الأحداث في الوقت الحقيقي — كل حدث يطلق سلسلة أتمتة</p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {Object.entries(EVENTS_META).map(([type, meta]) => (
                <button key={type} onClick={() => { const e2 = { ...events[0] }; fireEvent(type) }} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${s(meta.cls)}33`, background: `${s(meta.cls)}18`, color: s(meta.cls), cursor: 'pointer', fontFamily: 'Tajawal' }}>
                  {meta.icon} {type}
                </button>
              ))}
              <button onClick={() => setEvents([])} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Tajawal', marginRight: 'auto' }}>مسح</button>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
              <div style={{ padding: '14px 18px', background: 'var(--bg-elev)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="live-dot" /> Event Bus Monitor
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{events.length} حدث</div>
              </div>
              <div style={{ padding: 14, display: 'grid', gap: 6, minHeight: 200, maxHeight: 380, overflowY: 'auto' }}>
                {events.length === 0 ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                    <div style={{ fontSize: 44, marginBottom: 10, opacity: 0.35 }}>📡</div>
                    <div>اضغط على أي حدث أعلاه لمحاكاته</div>
                  </div>
                ) : events.map((ev, i) => (
                  <div key={i} className="animate-slide-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-elev)', fontSize: 12.5, borderRight: `3px solid ${s(ev.meta.cls)}` }}>
                    <span style={{ color: 'var(--muted)', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{ev.time}</span>
                    <span style={{ fontWeight: 700, fontSize: 11, color: s(ev.meta.cls) }}>{ev.meta.icon} {ev.type}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 11.5 }}>{ev.host}</span>
                    <span style={{ flex: 1 }}>{ev.meta.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <SectionTitle>نتائج الأتمتة</SectionTitle>
            {events.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: 44, marginBottom: 10, opacity: 0.35 }}>🔗</div>
                <div>عند تشغيل حدث ستظهر هنا الأتمتة التي تُفعّل لكل مضيف</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {DEFAULT_AUTOMATIONS.filter(a => events.some(e => e.type === a.trigger)).map((a, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(110,181,255,0.12)', color: 'var(--info)', border: '1px solid rgba(110,181,255,0.25)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{a.trigger}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 18 }}>←</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                      {a.actions.map((act, j) => (
                        <span key={j} style={{ background: 'rgba(212,165,116,0.1)', color: 'var(--accent)', border: '1px solid rgba(212,165,116,0.25)', padding: '3px 10px', borderRadius: 6, fontSize: 11.5 }}>{act}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ MODAL: ADD HOST ══ */}
      {addOpen && (
        <ModalOverlay onClose={() => setAddOpen(false)}>
          <h2 style={{ fontFamily: 'Reem Kufi', fontSize: 20, marginBottom: 4 }}>إضافة مضيف جديد</h2>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>Plug and Play — يشتغل من اللحظة الأولى بإعدادات افتراضية ذكية</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="اسم العقار / المضيف"><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="مثال: فيلا الياسمين" /></FormField>
            <FormField label="الموقع"><Input value={formLocation} onChange={e => setFormLocation(e.target.value)} placeholder="مثال: الرياض - النزهة" /></FormField>
            <FormField label="نوع العقار">
              <Select value={formType} onChange={e => setFormType(e.target.value as 'villa' | 'apartment' | 'chalet')}>
                <option value="villa">فيلا 🏡</option>
                <option value="apartment">شقة 🏢</option>
                <option value="chalet">شاليه 🏕️</option>
              </Select>
            </FormField>
            <FormField label="الحالة">
              <Select value={formStatus} onChange={e => setFormStatus(e.target.value as 'active' | 'inactive' | 'maintenance')}>
                <option value="active">نشط ✅</option>
                <option value="inactive">غير نشط</option>
                <option value="maintenance">صيانة 🔧</option>
              </Select>
            </FormField>
            <FormField label="رسالة ترحيب مخصصة" style={{ gridColumn: '1/-1' }}>
              <Input value={formWelcome} onChange={e => setFormWelcome(e.target.value)} placeholder="مثال: أهلاً وسهلاً في فيلتنا المميزة" />
            </FormField>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <Btn onClick={saveHost}>إضافة المضيف</Btn>
            <Btn secondary onClick={() => setAddOpen(false)}>إلغاء</Btn>
          </div>
        </ModalOverlay>
      )}

      {/* ══ MODAL: CONFIG HOST ══ */}
      {configOpen && configHost && (
        <ModalOverlay onClose={() => setConfigOpen(false)} wide>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ fontFamily: 'Reem Kufi', fontSize: 20, marginBottom: 4 }}>{configHost.name}</h2>
              <p style={{ color: 'var(--muted)', fontSize: 12.5 }}>هيّئ الـ modules والأتمتة لهذا المضيف</p>
            </div>
            <button onClick={() => setConfigOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 10, marginBottom: 22 }}>
            {([['info','المعلومات'],['modules','الـ Modules'],['auto','الأتمتة']] as const).map(([id,label]) => (
              <button key={id} onClick={() => setConfigTab(id)} style={{ flex: 1, padding: 9, textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: configTab === id ? '#0e1116' : 'var(--muted)', background: configTab === id ? 'var(--accent)' : 'transparent', border: 'none', fontWeight: 500, fontFamily: 'Tajawal', transition: 'all 0.2s' }}>{label}</button>
            ))}
          </div>

          {configTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="الاسم"><Input value={configHost.name} onChange={e => setConfigHost({ ...configHost, name: e.target.value })} /></FormField>
              <FormField label="الموقع"><Input value={configHost.location ?? ''} onChange={e => setConfigHost({ ...configHost, location: e.target.value })} /></FormField>
              <FormField label="النوع">
                <Select value={configHost.type} onChange={e => setConfigHost({ ...configHost, type: e.target.value as 'villa'|'apartment'|'chalet' })}>
                  <option value="villa">فيلا</option><option value="apartment">شقة</option><option value="chalet">شاليه</option>
                </Select>
              </FormField>
              <FormField label="الحالة">
                <Select value={configHost.status} onChange={e => setConfigHost({ ...configHost, status: e.target.value as 'active'|'inactive'|'maintenance' })}>
                  <option value="active">نشط</option><option value="inactive">غير نشط</option><option value="maintenance">صيانة</option>
                </Select>
              </FormField>
              <FormField label="رسالة ترحيب" style={{ gridColumn: '1/-1' }}>
                <Input value={configHost.welcome_message ?? ''} onChange={e => setConfigHost({ ...configHost, welcome_message: e.target.value })} />
              </FormField>
            </div>
          )}

          {configTab === 'modules' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Sports */}
              <ModuleCard
                icon="🏆" title="Sports"
                enabled={modules.sports?.enabled ?? false}
                onToggle={v => setConfigHost({ ...configHost, config: { ...configHost.config, modules: { ...modules, sports: { ...modules.sports, enabled: v } } } })}
              >
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>الدوريات</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {LEAGUES.map(l => {
                      const sel = modules.sports?.leagues?.includes(l.id)
                      return (
                        <button key={l.id} onClick={() => {
                          const cur = modules.sports?.leagues ?? []
                          const next = sel ? cur.filter(x => x !== l.id) : [...cur, l.id]
                          setConfigHost({ ...configHost, config: { ...configHost.config, modules: { ...modules, sports: { ...modules.sports, leagues: next } } } })
                        }} style={{ padding: '3px 9px', border: '1px solid', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal', background: sel ? 'rgba(212,165,116,0.15)' : 'var(--bg-elev)', color: sel ? 'var(--accent)' : 'var(--muted)', borderColor: sel ? 'var(--accent)' : 'var(--border)', transition: 'all 0.2s' }}>{l.label}</button>
                      )
                    })}
                  </div>
                </div>
              </ModuleCard>

              {/* Music */}
              <ModuleCard
                icon="🎵" title="Music"
                enabled={modules.music?.enabled ?? false}
                onToggle={v => setConfigHost({ ...configHost, config: { ...configHost.config, modules: { ...modules, music: { ...modules.music, enabled: v } } } })}
              >
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>النوع</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {MUSIC_GENRES.map(g => {
                      const sel = modules.music?.genre === g.id
                      return (
                        <button key={g.id} onClick={() => setConfigHost({ ...configHost, config: { ...configHost.config, modules: { ...modules, music: { ...modules.music, genre: g.id } } } })} style={{ padding: '3px 9px', border: '1px solid', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal', background: sel ? 'rgba(212,165,116,0.15)' : 'var(--bg-elev)', color: sel ? 'var(--accent)' : 'var(--muted)', borderColor: sel ? 'var(--accent)' : 'var(--border)' }}>{g.label}</button>
                      )
                    })}
                  </div>
                </div>
              </ModuleCard>

              {/* Lighting */}
              <ModuleCard
                icon="💡" title="Lighting"
                enabled={modules.lighting?.enabled ?? false}
                onToggle={v => setConfigHost({ ...configHost, config: { ...configHost.config, modules: { ...modules, lighting: { ...modules.lighting, enabled: v } } } })}
              >
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>المشهد</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {LIGHTING_SCENES.map(sc => {
                      const sel = modules.lighting?.scene === sc.id
                      return <button key={sc.id} onClick={() => setConfigHost({ ...configHost, config: { ...configHost.config, modules: { ...modules, lighting: { ...modules.lighting, scene: sc.id } } } })} style={{ padding: '3px 9px', border: '1px solid', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal', background: sel ? 'rgba(212,165,116,0.15)' : 'var(--bg-elev)', color: sel ? 'var(--accent)' : 'var(--muted)', borderColor: sel ? 'var(--accent)' : 'var(--border)' }}>{sc.label}</button>
                    })}
                  </div>
                </div>
              </ModuleCard>

              {/* AI */}
              <ModuleCard
                icon="🤖" title="AI"
                enabled={modules.ai?.enabled ?? false}
                onToggle={v => setConfigHost({ ...configHost, config: { ...configHost.config, modules: { ...modules, ai: { ...modules.ai, enabled: v } } } })}
              >
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>الشخصية</label>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {(['friendly','professional','minimal'] as const).map(p => {
                      const sel = modules.ai?.personality === p
                      return <button key={p} onClick={() => setConfigHost({ ...configHost, config: { ...configHost.config, modules: { ...modules, ai: { ...modules.ai, personality: p } } } })} style={{ padding: '3px 9px', border: '1px solid', borderRadius: 20, fontSize: 11, cursor: 'pointer', fontFamily: 'Tajawal', background: sel ? 'rgba(212,165,116,0.15)' : 'var(--bg-elev)', color: sel ? 'var(--accent)' : 'var(--muted)', borderColor: sel ? 'var(--accent)' : 'var(--border)' }}>{p}</button>
                    })}
                  </div>
                </div>
              </ModuleCard>
            </div>
          )}

          {configTab === 'auto' && (
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>كل حدث في الـ Event Bus يُطلق الأتمتة التالية لهذا المضيف. فعّل أو وقف كل أتمتة بشكل مستقل.</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {DEFAULT_AUTOMATIONS.map((a, i) => {
                  const key = `${a.trigger}-${i}`
                  const on = autoMap[key] ?? true
                  return (
                    <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(110,181,255,0.12)', color: 'var(--info)', border: '1px solid rgba(110,181,255,0.25)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{a.trigger}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 18 }}>←</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                        {a.actions.map((act, j) => <span key={j} style={{ background: 'rgba(212,165,116,0.1)', color: 'var(--accent)', border: '1px solid rgba(212,165,116,0.25)', padding: '3px 10px', borderRadius: 6, fontSize: 11.5 }}>{act}</span>)}
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, flexShrink: 0 }}>
                        <input type="checkbox" checked={on} onChange={e => setAutoMap({ ...autoMap, [key]: e.target.checked })} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span onClick={() => setAutoMap({ ...autoMap, [key]: !on })} style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: on ? 'var(--success)' : 'var(--border)', borderRadius: 24, transition: '0.3s' }}>
                          <span style={{ position: 'absolute', width: 18, height: 18, right: on ? 3 : 21, bottom: 3, background: 'white', borderRadius: '50%', transition: '0.3s' }} />
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <Btn onClick={saveHostConfig}>حفظ الإعدادات</Btn>
            <Btn danger onClick={deleteHost}>حذف المضيف</Btn>
            <Btn secondary onClick={() => setConfigOpen(false)}>إغلاق</Btn>
          </div>
        </ModalOverlay>
      )}

      <Toast msg={toast.msg} show={toast.show} />
    </div>
  )
}

// ── Small reusable components ──────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'Reem Kufi', fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 18, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />
      {children}
    </h2>
  )
}

function ModalOverlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '30px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 16, maxWidth: wide ? 820 : 780, width: '100%', padding: 28, margin: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={style}><label style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', marginBottom: 5, fontWeight: 500 }}>{label}</label>{children}</div>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 13px', borderRadius: 9, fontFamily: 'Tajawal', fontSize: 13.5, outline: 'none', ...props.style }} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 13px', borderRadius: 9, fontFamily: 'Tajawal', fontSize: 13.5, outline: 'none', ...props.style }}>{props.children}</select>
}

function Btn({ children, onClick, secondary, danger }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 20px', borderRadius: 9, fontFamily: 'Tajawal', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: secondary ? '1px solid var(--border)' : danger ? '1px solid rgba(229,107,111,0.3)' : 'none', background: secondary ? 'transparent' : danger ? 'transparent' : 'var(--accent)', color: secondary ? 'var(--text)' : danger ? 'var(--danger)' : '#0e1116', transition: 'all 0.2s' }}>{children}</button>
  )
}

function ModuleCard({ icon, title, enabled, onToggle, children }: { icon: string; title: string; enabled: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div style={{ background: enabled ? 'rgba(95,184,120,0.04)' : 'var(--bg-card)', border: `1px solid ${enabled ? 'rgba(95,184,120,0.4)' : 'var(--border)'}`, borderRadius: 12, padding: 16 } as React.CSSProperties}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
          <span style={{ fontSize: 20 }}>{icon}</span> {title}
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 24 }}>
          <input type="checkbox" checked={enabled} onChange={e => onToggle(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
          <span onClick={() => onToggle(!enabled)} style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: enabled ? 'var(--success)' : 'var(--border)', borderRadius: 24, transition: '0.3s' }}>
            <span style={{ position: 'absolute', width: 18, height: 18, right: enabled ? 3 : 21, bottom: 3, background: 'white', borderRadius: '50%', transition: '0.3s' }} />
          </span>
        </label>
      </div>
      {children}
    </div>
  )
}
