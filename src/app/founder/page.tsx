'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Unit, Booking } from '@/lib/types'
import { formatCurrency, getTypeIcon, getStatusLabel } from '@/lib/utils'

export default function FounderPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'units' | 'bookings'>('overview')

  const loadData = useCallback(async () => {
    const [u, b] = await Promise.all([
      supabase.from('units').select('*').order('monthly_income', { ascending: false }),
      supabase.from('bookings').select('*').order('checkin', { ascending: false }).limit(50),
    ])
    if (u.data) setUnits(u.data as Unit[])
    if (b.data) setBookings(b.data as Booking[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const ch = supabase.channel('founder-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadData])

  // ── Computed metrics ──────────────────────────────────────────
  const totalRevenue = units.reduce((s, u) => s + u.monthly_income, 0)
  const gathernTotal = units.reduce((s, u) => s + u.gathern_income, 0)
  const airbnbTotal  = units.reduce((s, u) => s + u.airbnb_income, 0)
  const directTotal  = totalRevenue - gathernTotal - airbnbTotal
  const activeUnits  = units.filter(u => u.status === 'active').length
  const occupancy    = units.length > 0 ? Math.round((activeUnits / units.length) * 100) : 0
  const avgPerUnit   = units.length > 0 ? Math.round(totalRevenue / units.length) : 0

  const activeBookings   = bookings.filter(b => b.status === 'active').length
  const completedBookings = bookings.filter(b => b.status === 'completed').length

  const maxIncome = Math.max(...units.map(u => u.monthly_income), 1)

  const sourceData = [
    { label: 'قاذرن', value: gathernTotal, color: '#5fb878', pct: totalRevenue ? Math.round(gathernTotal/totalRevenue*100) : 0 },
    { label: 'Airbnb', value: airbnbTotal,  color: '#e56b6f', pct: totalRevenue ? Math.round(airbnbTotal/totalRevenue*100) : 0 },
    { label: 'مباشر', value: directTotal,   color: '#6eb5ff', pct: totalRevenue ? Math.round(directTotal/totalRevenue*100) : 0 },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0e1116', fontFamily: 'Tajawal' }}>
      <div style={{ textAlign: 'center', color: '#8b94a3' }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: 'pulse-dot 1s infinite' }}>📊</div>
        <div>جارٍ تحميل البيانات…</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0e1116', color: '#e8eaed', fontFamily: 'Tajawal, sans-serif', backgroundImage: 'radial-gradient(circle at 20% 10%,rgba(212,165,116,0.06) 0%,transparent 40%),radial-gradient(circle at 80% 90%,rgba(212,165,116,0.04) 0%,transparent 40%)' }}>
      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid #2a3142', background: 'rgba(14,17,22,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: 10, display: 'grid', placeItems: 'center', fontFamily: 'Reem Kufi', fontWeight: 700, color: '#0e1116', fontSize: 18 }}>Q</div>
            <div>
              <div style={{ fontFamily: 'Reem Kufi', fontSize: 18, fontWeight: 600 }}>Qlivn OS</div>
              <div style={{ fontSize: 11, color: '#8b94a3' }}>Founder Layer · لوحة المؤسس</div>
            </div>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            {([['overview','📊 النظرة العامة'],['units','🏠 الوحدات'],['bookings','📅 الحجوزات']] as const).map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ padding: '7px 13px', color: tab === id ? '#d4a574' : '#8b94a3', background: tab === id ? 'rgba(212,165,116,0.1)' : 'transparent', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>{label}</button>
            ))}
          </nav>
          <a href="/host" style={{ padding: '7px 13px', color: '#8b94a3', background: 'transparent', border: '1px solid #2a3142', borderRadius: 8, fontSize: 12, textDecoration: 'none' }}>⬅ Host Layer</a>
        </div>
      </header>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: 28 }}>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 30, fontWeight: 600, marginBottom: 5 }}>لوحة المؤسس</h1>
              <p style={{ color: '#8b94a3', fontSize: 14 }}>نظرة شاملة على الأداء المالي وإشغال الوحدات</p>
            </div>

            {/* KPI Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14, marginBottom: 32 }}>
              {[
                { label: 'إجمالي الإيرادات (شهري)', value: formatCurrency(totalRevenue), trend: `${units.length} وحدة نشطة`, up: true },
                { label: 'نسبة الإشغال', value: `${occupancy}%`, trend: `${activeUnits} من ${units.length} وحدة`, up: occupancy > 70 },
                { label: 'متوسط الإيراد / وحدة', value: formatCurrency(avgPerUnit), trend: 'شهرياً', up: true },
                { label: 'حجوزات نشطة', value: activeBookings.toString(), trend: `${completedBookings} مكتمل`, up: activeBookings > 0 },
              ].map((st, i) => (
                <div key={i} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle,rgba(212,165,116,0.08),transparent 70%)' }} />
                  <div style={{ fontSize: 11, color: '#8b94a3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{st.label}</div>
                  <div style={{ fontFamily: 'Reem Kufi', fontSize: 26, fontWeight: 600, color: i === 0 ? '#d4a574' : '#e8eaed' }}>{st.value}</div>
                  <div style={{ fontSize: 11, color: st.up ? '#5fb878' : '#8b94a3', marginTop: 4 }}>{st.trend}</div>
                </div>
              ))}
            </div>

            {/* Revenue by Source */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 16, padding: 22 }}>
                <SectionTitle>الإيرادات حسب المصدر</SectionTitle>
                <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                  {sourceData.map(src => (
                    <div key={src.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{src.label}</span>
                        <span style={{ fontSize: 12, color: '#8b94a3' }}>{src.pct}% · {formatCurrency(src.value)}</span>
                      </div>
                      <div style={{ height: 8, background: '#2a3142', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${src.pct}%`, background: src.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #2a3142', display: 'flex', gap: 16 }}>
                  {sourceData.map(src => (
                    <div key={src.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: src.color }} />
                      <span style={{ fontSize: 12, color: '#8b94a3' }}>{src.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unit Performance Bar Chart */}
              <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 16, padding: 22 }}>
                <SectionTitle>أداء الوحدات</SectionTitle>
                <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                  {units.slice(0, 5).map(u => (
                    <div key={u.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13 }}>{getTypeIcon(u.type)} {u.name}</span>
                        <span style={{ fontSize: 12, color: '#d4a574', fontFamily: 'Reem Kufi' }}>{formatCurrency(u.monthly_income)}</span>
                      </div>
                      <div style={{ height: 6, background: '#2a3142', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(u.monthly_income/maxIncome*100)}%`, background: 'linear-gradient(90deg,#d4a574,#e8c9a0)', borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Units Table */}
            <SectionTitle>أفضل الوحدات أداءً</SectionTitle>
            <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 16, overflow: 'hidden', marginBottom: 32 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#161a22' }}>
                    {['الوحدة', 'النوع', 'الحالة', 'قاذرن', 'Airbnb', 'مباشر', 'إجمالي'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'right', color: '#8b94a3', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #2a3142' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {units.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #2a3142', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: '12px 14px', color: '#8b94a3' }}>{u.type === 'villa' ? 'فيلا' : u.type === 'chalet' ? 'شاليه' : 'شقة'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: u.status === 'active' ? 'rgba(95,184,120,0.12)' : u.status === 'maintenance' ? 'rgba(240,198,116,0.12)' : 'rgba(139,148,163,0.12)', color: u.status === 'active' ? '#5fb878' : u.status === 'maintenance' ? '#f0c674' : '#8b94a3' }}>
                          {getStatusLabel(u.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#5fb878' }}>{formatCurrency(u.gathern_income)}</td>
                      <td style={{ padding: '12px 14px', color: '#e56b6f' }}>{formatCurrency(u.airbnb_income)}</td>
                      <td style={{ padding: '12px 14px', color: '#6eb5ff' }}>{formatCurrency(u.monthly_income - u.gathern_income - u.airbnb_income)}</td>
                      <td style={{ padding: '12px 14px', color: '#d4a574', fontFamily: 'Reem Kufi', fontWeight: 700 }}>{formatCurrency(u.monthly_income)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(212,165,116,0.04)', borderTop: '2px solid rgba(212,165,116,0.2)' }}>
                    <td colSpan={3} style={{ padding: '12px 14px', fontWeight: 700 }}>الإجمالي</td>
                    <td style={{ padding: '12px 14px', color: '#5fb878', fontWeight: 700 }}>{formatCurrency(gathernTotal)}</td>
                    <td style={{ padding: '12px 14px', color: '#e56b6f', fontWeight: 700 }}>{formatCurrency(airbnbTotal)}</td>
                    <td style={{ padding: '12px 14px', color: '#6eb5ff', fontWeight: 700 }}>{formatCurrency(directTotal)}</td>
                    <td style={{ padding: '12px 14px', color: '#d4a574', fontFamily: 'Reem Kufi', fontWeight: 700, fontSize: 15 }}>{formatCurrency(totalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ══ UNITS ══ */}
        {tab === 'units' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 30, fontWeight: 600, marginBottom: 5 }}>الوحدات</h1>
              <p style={{ color: '#8b94a3', fontSize: 14 }}>إدارة ومتابعة جميع الوحدات السكنية</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
              {units.map(u => (
                <div key={u.id} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 16, padding: 20, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(212,165,116,0.12)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{getTypeIcon(u.type)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: '#8b94a3' }}>{u.location}</div>
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, background: u.status === 'active' ? 'rgba(95,184,120,0.12)' : 'rgba(240,198,116,0.12)', color: u.status === 'active' ? '#5fb878' : '#f0c674' }}>{getStatusLabel(u.status)}</span>
                  </div>
                  {u.current_guest_name && (
                    <div style={{ padding: '8px 12px', background: 'rgba(110,181,255,0.08)', border: '1px solid rgba(110,181,255,0.15)', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
                      👤 {u.current_guest_name}
                      {u.checkout_time && <span style={{ color: '#8b94a3', marginRight: 8 }}>← {new Date(u.checkout_time).toLocaleDateString('ar-SA')}</span>}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'قاذرن', value: formatCurrency(u.gathern_income), color: '#5fb878' },
                      { label: 'Airbnb', value: formatCurrency(u.airbnb_income), color: '#e56b6f' },
                      { label: 'الإجمالي', value: formatCurrency(u.monthly_income), color: '#d4a574' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#161a22', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#8b94a3', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <a href={`/guest/${u.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(212,165,116,0.1)', border: '1px solid rgba(212,165,116,0.2)', color: '#d4a574', fontSize: 12, textAlign: 'center', textDecoration: 'none' }}>🔗 بوابة الضيف</a>
                    <a href={`/tablet/${u.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px', borderRadius: 8, background: 'rgba(110,181,255,0.08)', border: '1px solid rgba(110,181,255,0.15)', color: '#6eb5ff', fontSize: 12, textAlign: 'center', textDecoration: 'none' }}>📱 التابلت</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ BOOKINGS ══ */}
        {tab === 'bookings' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 30, fontWeight: 600, marginBottom: 5 }}>الحجوزات</h1>
              <p style={{ color: '#8b94a3', fontSize: 14 }}>جميع الحجوزات عبر المنصات</p>
            </div>
            <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 16, overflow: 'hidden' }}>
              {bookings.length === 0 ? (
                <div style={{ padding: '50px 20px', textAlign: 'center', color: '#8b94a3' }}>
                  <div style={{ fontSize: 44, marginBottom: 10, opacity: 0.35 }}>📅</div>
                  <div>لا توجد حجوزات حتى الآن</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#161a22' }}>
                      {['الضيف', 'المصدر', 'الدخول', 'المغادرة', 'السعر', 'الحالة'].map(h => (
                        <th key={h} style={{ padding: '12px 14px', textAlign: 'right', color: '#8b94a3', fontWeight: 500, fontSize: 11, borderBottom: '1px solid #2a3142' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b, i) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #2a3142', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{b.guest_name}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: b.source === 'gathern' ? 'rgba(95,184,120,0.12)' : b.source === 'airbnb' ? 'rgba(229,107,111,0.12)' : 'rgba(110,181,255,0.12)', color: b.source === 'gathern' ? '#5fb878' : b.source === 'airbnb' ? '#e56b6f' : '#6eb5ff' }}>
                            {b.source === 'gathern' ? 'قاذرن' : b.source === 'airbnb' ? 'Airbnb' : 'مباشر'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#8b94a3' }}>{new Date(b.checkin).toLocaleDateString('ar-SA')}</td>
                        <td style={{ padding: '12px 14px', color: '#8b94a3' }}>{new Date(b.checkout).toLocaleDateString('ar-SA')}</td>
                        <td style={{ padding: '12px 14px', color: '#d4a574', fontFamily: 'Reem Kufi' }}>{formatCurrency(b.price)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: b.status === 'active' ? 'rgba(95,184,120,0.12)' : b.status === 'upcoming' ? 'rgba(110,181,255,0.12)' : b.status === 'cancelled' ? 'rgba(229,107,111,0.12)' : 'rgba(139,148,163,0.12)', color: b.status === 'active' ? '#5fb878' : b.status === 'upcoming' ? '#6eb5ff' : b.status === 'cancelled' ? '#e56b6f' : '#8b94a3' }}>
                            {b.status === 'active' ? 'نشط' : b.status === 'upcoming' ? 'قادم' : b.status === 'completed' ? 'مكتمل' : 'ملغي'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 3, height: 16, background: '#d4a574', borderRadius: 2, display: 'inline-block' }} />
      {children}
    </h2>
  )
}
