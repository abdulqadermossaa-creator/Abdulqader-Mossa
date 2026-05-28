'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────
interface User { id: string; username: string; name: string; role: string; passwordHash: string; createdAt: string }
interface Record { id: string; type: 'owner'|'tenant'|'company'; name: string; details: string; date: string; createdAt: string; createdBy: string; endDate?: string; data: Record2 }
interface Record2 { [key: string]: string }
interface OwnerAccount { id: string; recordId: string; loginMethod: 'account'|'link'; username?: string; password?: string; code?: string; ownerName: string }
interface Lead { id: string; name: string; phone: string; status: string; source: string; notes: string; createdAt: string }
interface Req { id: string; ownerId: string; ownerName: string; title: string; type: string; desc: string; priority: string; status: string; adminResponse: string; createdAt: string }

type Page = 'dashboard'|'records'|'owners-mgmt'|'marketing'|'alerts'|'reports'|'settings'

// ── Simple hash ────────────────────────────────────────────────
function hash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return h.toString(36)
}

function uid() { return '_' + Math.random().toString(36).slice(2, 10) }
function now() { return new Date().toLocaleDateString('ar-SA') }

const DEFAULT_COMPANY_CODE = 'QLIVN-2024'

// ── Storage helpers ────────────────────────────────────────────
function load<T>(key: string, def: T): T {
  if (typeof window === 'undefined') return def
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── CSS helpers ────────────────────────────────────────────────
const S = {
  btn: (variant: 'primary'|'secondary'|'danger' = 'primary'): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: 9, fontFamily: 'Tajawal, sans-serif', fontSize: 13.5, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
    background: variant === 'primary' ? '#d4a574' : 'transparent',
    color: variant === 'primary' ? '#0e1116' : variant === 'danger' ? '#e56b6f' : '#e8eaed',
    border: variant === 'primary' ? 'none' : variant === 'danger' ? '1px solid rgba(229,107,111,0.3)' : '1px solid #2a3142',
  }),
  input: (): React.CSSProperties => ({ width: '100%', background: '#1c2230', border: '1px solid #2a3142', color: '#e8eaed', padding: '10px 13px', borderRadius: 9, fontFamily: 'Tajawal, sans-serif', fontSize: 13.5, outline: 'none' }),
  label: (): React.CSSProperties => ({ display: 'block', fontSize: 12.5, color: '#8b94a3', marginBottom: 5, fontWeight: 500 }),
  card: (): React.CSSProperties => ({ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 22, marginBottom: 16 }),
  tag: (type: string): React.CSSProperties => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
    background: type === 'owner' ? 'rgba(95,184,120,0.15)' : type === 'tenant' ? 'rgba(240,198,116,0.15)' : 'rgba(212,165,116,0.15)',
    color: type === 'owner' ? '#5fb878' : type === 'tenant' ? '#f0c674' : '#d4a574',
  }),
}

const fieldOf = (obj: Record2, k: string) => obj?.[k] ?? ''

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function FounderPage() {
  // ── Auth state ─────────────────────────────────────────────
  const [screen, setScreen] = useState<'auth'|'app'|'owner-portal'>('auth')
  const [loginType, setLoginType] = useState<'partner'|'owner'>('partner')
  const [authMode, setAuthMode] = useState<'login'|'register'>('login')
  const [ownerMode, setOwnerMode] = useState<'account'|'link'>('account')

  // partner login fields
  const [pUsername, setPUsername] = useState('')
  const [pPassword, setPPassword] = useState('')
  const [pName, setPName] = useState('')
  const [pRole, setPRole] = useState<'partner'|'manager'>('partner')
  const [pCode, setPCode] = useState('')
  const [authErr, setAuthErr] = useState('')
  const [authInfo, setAuthInfo] = useState('')

  // owner login fields
  const [oUsername, setOUsername] = useState('')
  const [oPassword, setOPassword] = useState('')
  const [oCode, setOCode] = useState('')
  const [ownerErr, setOwnerErr] = useState('')

  // ── App state ──────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentOwner, setCurrentOwner] = useState<OwnerAccount | null>(null)

  // Data
  const [users, setUsers] = useState<User[]>([])
  const [records, setRecords] = useState<Record[]>([])
  const [ownerAccounts, setOwnerAccounts] = useState<OwnerAccount[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [requests, setRequests] = useState<Req[]>([])
  const [companyCode, setCompanyCode] = useState(DEFAULT_COMPANY_CODE)

  // UI state
  const [toast, setToast] = useState({ show: false, msg: '', err: false })
  const [recordFilter, setRecordFilter] = useState<'all'|'owner'|'tenant'|'company'>('all')
  const [leadFilter, setLeadFilter] = useState('all')
  const [showCodePlain, setShowCodePlain] = useState(false)

  // Modal state
  const [openModal, setOpenModal] = useState<string|null>(null)
  const [editRecord, setEditRecord] = useState<Record|null>(null)

  // Forms
  const [ownerForm, setOwnerForm] = useState<Record2>({})
  const [tenantForm, setTenantForm] = useState<Record2>({})
  const [companyForm, setCompanyForm] = useState<Record2>({})
  const [leadForm, setLeadForm] = useState({ name:'', phone:'', status:'pending', source:'توصية شخصية', notes:'' })
  const [createOwnerForm, setCreateOwnerForm] = useState({ recordId:'', loginMethod:'account' as 'account'|'link', username:'', password:'', code:'' })
  const [reqForm, setReqForm] = useState({ title:'', type:'صيانة', desc:'', priority:'متوسطة' })

  // ── Init ───────────────────────────────────────────────────
  useEffect(() => {
    const u = load<User[]>('ph_users', [])
    const r = load<Record[]>('ph_records', [])
    const oa = load<OwnerAccount[]>('ph_owner_accounts', [])
    const l = load<Lead[]>('ph_leads', [])
    const reqs = load<Req[]>('ph_requests', [])
    const cc = load<string>('ph_company_code', DEFAULT_COMPANY_CODE)
    setUsers(u); setRecords(r); setOwnerAccounts(oa); setLeads(l); setRequests(reqs); setCompanyCode(cc)

    const session = load<string>('ph_session', '')
    if (session) {
      if (session.startsWith('partner:')) {
        const uname = session.replace('partner:', '')
        const user = u.find(x => x.username === uname)
        if (user) { setCurrentUser(user); setScreen('app') }
      } else if (session.startsWith('owner:')) {
        const oid = session.replace('owner:', '')
        const owner = oa.find(x => x.id === oid)
        if (owner) { setCurrentOwner(owner); setScreen('owner-portal') }
      }
    }
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ show: true, msg, err })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  // ── Auth handlers ──────────────────────────────────────────
  function handlePartnerAuth() {
    setAuthErr(''); setAuthInfo('')
    if (!pUsername || !pPassword) { setAuthErr('الرجاء تعبئة جميع الحقول'); return }
    if (authMode === 'register') {
      if (!pName) { setAuthErr('الرجاء إدخال الاسم'); return }
      if (pCode !== companyCode) { setAuthErr('الرمز السري للشركة غير صحيح'); return }
      if (users.find(u => u.username === pUsername)) { setAuthErr('اسم المستخدم مستخدم بالفعل'); return }
      if (pPassword.length < 6) { setAuthErr('كلمة المرور قصيرة جداً (6 أحرف على الأقل)'); return }
      const newUser: User = { id: uid(), username: pUsername, name: pName, role: pRole, passwordHash: hash(pPassword), createdAt: new Date().toISOString() }
      const next = [...users, newUser]
      setUsers(next); save('ph_users', next)
      setAuthInfo('تم إنشاء الحساب! يمكنك الدخول الآن')
      setTimeout(() => setAuthMode('login'), 1200)
    } else {
      const user = users.find(u => u.username === pUsername)
      if (!user || user.passwordHash !== hash(pPassword)) { setAuthErr('اسم المستخدم أو كلمة المرور غير صحيحة'); return }
      save('ph_session', 'partner:' + pUsername)
      setCurrentUser(user); setScreen('app')
    }
  }

  function handleOwnerLogin() {
    setOwnerErr('')
    const acc = ownerAccounts.find(o => o.loginMethod === 'account' && o.username === oUsername && o.password === oPassword)
    if (!acc) { setOwnerErr('بيانات الدخول غير صحيحة'); return }
    save('ph_session', 'owner:' + acc.id)
    setCurrentOwner(acc); setScreen('owner-portal')
  }

  function handleOwnerCodeLogin() {
    setOwnerErr('')
    const acc = ownerAccounts.find(o => o.loginMethod === 'link' && o.code === oCode.trim())
    if (!acc) { setOwnerErr('الرمز غير صحيح أو منتهي'); return }
    save('ph_session', 'owner:' + acc.id)
    setCurrentOwner(acc); setScreen('owner-portal')
  }

  function logout() { save('ph_session', ''); setCurrentUser(null); setScreen('auth') }
  function logoutOwner() { save('ph_session', ''); setCurrentOwner(null); setScreen('auth') }

  // ── Records ────────────────────────────────────────────────
  function saveRec(type: 'owner'|'tenant'|'company') {
    const form = type === 'owner' ? ownerForm : type === 'tenant' ? tenantForm : companyForm
    const name = fieldOf(form, type === 'owner' ? 'name' : type === 'tenant' ? 'name' : 'partner')
    if (!name) { showToast('الرجاء إدخال الاسم', true); return }
    const rec: Record = {
      id: 'rec_' + uid(), type, name,
      details: type === 'owner' ? `${fieldOf(form,'propertyType')} - ${fieldOf(form,'property')||'غير محدد'}` :
               type === 'tenant' ? `${fieldOf(form,'rent')||'0'} ر.س - ${fieldOf(form,'payment')}` :
               `${fieldOf(form,'share')||'0'}% - ${fieldOf(form,'role')}`,
      date: now(), createdAt: new Date().toISOString(),
      createdBy: currentUser?.name ?? '',
      endDate: type === 'tenant' ? fieldOf(form, 'endDate') : undefined,
      data: { ...form },
    }
    const next = [rec, ...records]
    setRecords(next); save('ph_records', next)
    setOpenModal(null)
    if (type === 'owner') setOwnerForm({})
    else if (type === 'tenant') setTenantForm({})
    else setCompanyForm({})
    showToast('تم الحفظ بنجاح')
  }

  function deleteRec(id: string) {
    if (!confirm('متأكد من حذف هذا السجل؟')) return
    const next = records.filter(r => r.id !== id)
    setRecords(next); save('ph_records', next); showToast('تم الحذف')
  }

  // ── Leads ──────────────────────────────────────────────────
  function addLead() {
    if (!leadForm.name) { showToast('أدخل اسم العميل', true); return }
    const lead: Lead = { id: uid(), ...leadForm, createdAt: new Date().toISOString() }
    const next = [lead, ...leads]
    setLeads(next); save('ph_leads', next)
    setLeadForm({ name:'', phone:'', status:'pending', source:'توصية شخصية', notes:'' })
    showToast('تم إضافة العميل')
  }

  function updateLeadStatus(id: string, status: string) {
    const next = leads.map(l => l.id === id ? { ...l, status } : l)
    setLeads(next); save('ph_leads', next); showToast('تم التحديث')
  }

  function deleteLead(id: string) {
    const next = leads.filter(l => l.id !== id)
    setLeads(next); save('ph_leads', next); showToast('تم الحذف')
  }

  // ── Owner Accounts ─────────────────────────────────────────
  function createOwnerAccount() {
    if (!createOwnerForm.recordId) { showToast('اختر المالك', true); return }
    const rec = records.find(r => r.id === createOwnerForm.recordId)
    if (!rec) return
    const existing = ownerAccounts.find(o => o.recordId === createOwnerForm.recordId)
    const acc: OwnerAccount = {
      id: uid(),
      recordId: createOwnerForm.recordId,
      ownerName: rec.name,
      loginMethod: createOwnerForm.loginMethod,
      username: createOwnerForm.loginMethod === 'account' ? createOwnerForm.username : undefined,
      password: createOwnerForm.loginMethod === 'account' ? createOwnerForm.password : undefined,
      code: createOwnerForm.loginMethod === 'link' ? ('OWN-' + uid().toUpperCase()) : undefined,
    }
    const next = existing ? ownerAccounts.map(o => o.recordId === acc.recordId ? acc : o) : [...ownerAccounts, acc]
    setOwnerAccounts(next); save('ph_owner_accounts', next)
    setOpenModal(null)
    showToast('تم إنشاء الحساب')
  }

  function deleteOwnerAccount(id: string) {
    const next = ownerAccounts.filter(o => o.id !== id)
    setOwnerAccounts(next); save('ph_owner_accounts', next); showToast('تم الحذف')
  }

  // ── Requests ───────────────────────────────────────────────
  function addRequest() {
    if (!reqForm.title) { showToast('أدخل العنوان', true); return }
    const req: Req = { id: uid(), ownerId: currentOwner?.id ?? '', ownerName: currentOwner?.ownerName ?? '', ...reqForm, status: 'pending', adminResponse: '', createdAt: new Date().toISOString() }
    const next = [req, ...requests]
    setRequests(next); save('ph_requests', next)
    setOpenModal(null); setReqForm({ title:'', type:'صيانة', desc:'', priority:'متوسطة' })
    showToast('تم إرسال الطلب')
  }

  function respondRequest(id: string, response: string) {
    const next = requests.map(r => r.id === id ? { ...r, adminResponse: response, status: 'done' } : r)
    setRequests(next); save('ph_requests', next); showToast('تم الرد')
  }

  // ── Computed ───────────────────────────────────────────────
  const ownerRecs = records.filter(r => r.type === 'owner')
  const tenantRecs = records.filter(r => r.type === 'tenant')
  const companyRecs = records.filter(r => r.type === 'company')
  const pendingLeads = leads.filter(l => l.status === 'pending').length
  const contactedLeads = leads.filter(l => l.status === 'contacted').length
  const followingLeads = leads.filter(l => l.status === 'following').length

  const today = new Date()
  const alerts = records.filter(r => r.type === 'tenant' && r.endDate).map(r => {
    const end = new Date(r.endDate!)
    const days = Math.round((end.getTime() - today.getTime()) / 86400000)
    return { r, days }
  }).filter(({ days }) => days < 60).sort((a, b) => a.days - b.days)

  const filteredRecords = recordFilter === 'all' ? records : records.filter(r => r.type === recordFilter)
  const filteredLeads = leadFilter === 'all' ? leads : leads.filter(l => l.status === leadFilter)

  // Owner portal computed
  const ownerRec = currentOwner ? records.find(r => r.id === currentOwner.recordId) : null
  const ownerRequests = currentOwner ? requests.filter(r => r.ownerId === currentOwner.id) : []
  const ownerTenants = currentOwner && ownerRec ? tenantRecs.filter(r => fieldOf(r.data,'property').includes(fieldOf(ownerRec.data,'property'))) : []

  // ── Helpers for rendering ──────────────────────────────────
  const leadStatusLabel: Record<string, string> = {
    pending: 'لم يتم التواصل', contacted: 'تم التواصل', following: 'قيد المتابعة', closed: 'مغلق', converted: 'عميل'
  }
  const leadStatusColor: Record<string, string> = {
    pending: '#e56b6f', contacted: '#5fb878', following: '#f0c674', closed: '#8b94a3', converted: '#d4a574'
  }

  // ══════════════════════════════════════════════════════════
  // AUTH SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === 'auth') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#0e1116', backgroundImage: 'radial-gradient(circle at 20% 10%,rgba(212,165,116,0.06) 0%,transparent 40%),radial-gradient(circle at 80% 90%,rgba(212,165,116,0.04) 0%,transparent 40%)', fontFamily: 'Tajawal, sans-serif', color: '#e8eaed' }}>
      <div style={{ background: '#161a22', border: '1px solid #2a3142', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-30%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(212,165,116,0.12),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: 14, display: 'grid', placeItems: 'center', fontFamily: 'Reem Kufi, sans-serif', fontWeight: 700, color: '#0e1116', fontSize: 28, marginBottom: 24, position: 'relative' }}>P</div>
        <h2 style={{ fontFamily: 'Reem Kufi', fontSize: 26, marginBottom: 6, position: 'relative' }}>
          {loginType === 'partner' ? (authMode === 'register' ? 'إنشاء حساب جديد' : 'دخول الشركاء') : 'دخول الملاك'}
        </h2>
        <p style={{ color: '#8b94a3', fontSize: 14, marginBottom: 28, position: 'relative' }}>
          {loginType === 'partner' ? (authMode === 'register' ? 'تحتاج الرمز السري من المؤسس' : 'نظام إدارة الشركة') : 'بوابة مالك العقار'}
        </p>

        {/* Login type tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22, padding: 4, background: '#1c2230', borderRadius: 10 }}>
          {(['partner','owner'] as const).map(t => (
            <button key={t} onClick={() => setLoginType(t)} style={{ padding: 11, textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: loginType === t ? '#0e1116' : '#8b94a3', background: loginType === t ? '#d4a574' : 'transparent', border: 'none', fontWeight: 500, fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
              <span style={{ display: 'block', fontSize: 18, marginBottom: 2 }}>{t === 'partner' ? '🔐' : '🏠'}</span>
              {t === 'partner' ? 'شريك / موظف' : 'مالك عقار'}
            </button>
          ))}
        </div>

        {loginType === 'partner' && (
          <>
            {/* Login/Register tabs */}
            <div style={{ display: 'flex', gap: 4, background: '#1c2230', padding: 4, borderRadius: 10, marginBottom: 22 }}>
              {(['login','register'] as const).map(m => (
                <button key={m} onClick={() => { setAuthMode(m); setAuthErr(''); setAuthInfo('') }} style={{ flex: 1, padding: 9, textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: authMode === m ? '#0e1116' : '#8b94a3', background: authMode === m ? '#d4a574' : 'transparent', border: 'none', fontWeight: 500, fontFamily: 'Tajawal' }}>
                  {m === 'login' ? 'دخول' : 'إنشاء حساب'}
                </button>
              ))}
            </div>

            {authErr && <div style={{ background: 'rgba(229,107,111,0.1)', color: '#e56b6f', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{authErr}</div>}
            {authInfo && <div style={{ background: 'rgba(95,184,120,0.1)', color: '#5fb878', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{authInfo}</div>}

            {authMode === 'register' && (
              <>
                <Field label="الاسم الكامل"><input style={S.input()} value={pName} onChange={e => setPName(e.target.value)} placeholder="اسمك الكامل" /></Field>
                <div style={{ marginBottom: 14 }}>
                  <span style={S.label()}>الدور</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(['partner','manager'] as const).map(r => (
                      <button key={r} onClick={() => setPRole(r)} style={{ padding: 10, border: `1px solid ${pRole === r ? '#d4a574' : '#2a3142'}`, borderRadius: 9, textAlign: 'center', cursor: 'pointer', fontSize: 13, background: pRole === r ? 'rgba(212,165,116,0.1)' : '#1c2230', color: pRole === r ? '#d4a574' : '#e8eaed', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
                        {r === 'partner' ? 'شريك' : 'مدير'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <Field label="اسم المستخدم"><input style={S.input()} value={pUsername} onChange={e => setPUsername(e.target.value)} placeholder="اسم المستخدم" /></Field>
            <Field label="كلمة المرور"><input style={S.input()} type="password" value={pPassword} onChange={e => setPPassword(e.target.value)} placeholder="••••••••" /></Field>
            {authMode === 'register' && (
              <Field label="الرمز السري للشركة">
                <input style={S.input()} type="password" value={pCode} onChange={e => setPCode(e.target.value)} placeholder="الرمز السري" />
                <p style={{ fontSize: 11.5, color: '#8b94a3', marginTop: 5 }}>يحصل عليه الشريك من المؤسس فقط</p>
              </Field>
            )}
            <button onClick={handlePartnerAuth} style={{ ...S.btn(), width: '100%', marginTop: 6 }}>
              {authMode === 'login' ? 'دخول' : 'إنشاء الحساب'}
            </button>
          </>
        )}

        {loginType === 'owner' && (
          <>
            <div style={{ display: 'flex', gap: 4, background: '#1c2230', padding: 4, borderRadius: 10, marginBottom: 22 }}>
              {(['account','link'] as const).map(m => (
                <button key={m} onClick={() => setOwnerMode(m)} style={{ flex: 1, padding: 9, textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: ownerMode === m ? '#0e1116' : '#8b94a3', background: ownerMode === m ? '#d4a574' : 'transparent', border: 'none', fontWeight: 500, fontFamily: 'Tajawal' }}>
                  {m === 'account' ? 'حساب' : 'رابط خاص'}
                </button>
              ))}
            </div>
            {ownerErr && <div style={{ background: 'rgba(229,107,111,0.1)', color: '#e56b6f', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{ownerErr}</div>}
            {ownerMode === 'account' ? (
              <>
                <Field label="اسم المستخدم أو رقم الجوال"><input style={S.input()} value={oUsername} onChange={e => setOUsername(e.target.value)} placeholder="مثال: 05xxxxxxxx" /></Field>
                <Field label="كلمة المرور"><input style={S.input()} type="password" value={oPassword} onChange={e => setOPassword(e.target.value)} placeholder="••••••••" /></Field>
                <button onClick={handleOwnerLogin} style={{ ...S.btn(), width: '100%' }}>دخول</button>
              </>
            ) : (
              <>
                <Field label="الرمز الخاص بك">
                  <input style={S.input()} value={oCode} onChange={e => setOCode(e.target.value)} placeholder="مثال: OWN-XXXX-XXXX" />
                  <p style={{ fontSize: 11.5, color: '#8b94a3', marginTop: 5 }}>الرمز الذي أرسلته لك الشركة</p>
                </Field>
                <button onClick={handleOwnerCodeLogin} style={{ ...S.btn(), width: '100%' }}>دخول بالرمز</button>
              </>
            )}
            <p style={{ textAlign: 'center', fontSize: 11.5, color: '#8b94a3', marginTop: 14 }}>ليس لديك حساب؟ تواصل مع الشركة لتفعيله</p>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 11.5, color: '#8b94a3', marginTop: 18 }}>نظام محمي — لا يمكن الوصول للبيانات إلا بعد تسجيل الدخول</p>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // OWNER PORTAL
  // ══════════════════════════════════════════════════════════
  if (screen === 'owner-portal' && currentOwner) return (
    <div style={{ minHeight: '100vh', background: '#0e1116', color: '#e8eaed', fontFamily: 'Tajawal, sans-serif' }}>
      <header style={{ borderBottom: '1px solid #2a3142', background: 'rgba(14,17,22,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: 10, display: 'grid', placeItems: 'center', fontFamily: 'Reem Kufi', fontWeight: 700, color: '#0e1116', fontSize: 20 }}>P</div>
            <div>
              <div style={{ fontFamily: 'Reem Kufi', fontSize: 19, fontWeight: 600 }}>Property Hub</div>
              <div style={{ fontSize: 11, color: '#8b94a3' }}>بوابة المالك <span style={{ background: 'rgba(95,184,120,0.15)', color: '#5fb878', padding: '2px 8px', borderRadius: 20, fontSize: 10 }}>Owner Portal</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px 6px 14px', background: '#1c2230', border: '1px solid #2a3142', borderRadius: 30, fontSize: 13 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#0e1116', fontWeight: 700, fontSize: 12 }}>{currentOwner.ownerName.charAt(0)}</div>
            <span>{currentOwner.ownerName}</span>
            <button onClick={logoutOwner} style={{ background: 'transparent', border: 'none', color: '#8b94a3', cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}>خروج</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 28 }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(212,165,116,0.08),rgba(95,184,120,0.05))', border: '1px solid #2a3142', borderRadius: 16, padding: 28, marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: 280, height: 280, background: 'radial-gradient(circle,rgba(212,165,116,0.15),transparent 70%)', pointerEvents: 'none' }} />
          <h1 style={{ fontFamily: 'Reem Kufi', fontSize: 28, marginBottom: 6, position: 'relative' }}>أهلاً بك، {currentOwner.ownerName}</h1>
          <p style={{ color: '#8b94a3', fontSize: 14, position: 'relative' }}>نظرة شاملة على عقاراتك، عقودك، وطلباتك في مكان واحد</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'عقاراتك', value: ownerRec ? 1 : 0, trend: 'إجمالي' },
            { label: 'مؤجرة', value: ownerTenants.length, trend: 'نشطة', color: '#5fb878' },
            { label: 'شاغرة', value: Math.max(0, (ownerRec ? 1 : 0) - ownerTenants.length), trend: 'متاحة', color: '#f0c674' },
            { label: 'طلباتك', value: ownerRequests.length, trend: 'قيد المعالجة / منجزة' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle,rgba(212,165,116,0.08),transparent 70%)' }} />
              <div style={{ fontSize: 11, color: '#8b94a3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'Reem Kufi', fontSize: 28, fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.color ?? '#8b94a3', marginTop: 4 }}>{s.trend}</div>
            </div>
          ))}
        </div>

        <SecTitle>عقاراتك</SecTitle>
        {ownerRec ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(212,165,116,0.15)', display: 'grid', placeItems: 'center', fontSize: 20 }}>🏠</div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: ownerTenants.length > 0 ? 'rgba(95,184,120,0.15)' : 'rgba(229,107,111,0.15)', color: ownerTenants.length > 0 ? '#5fb878' : '#e56b6f' }}>
                  {ownerTenants.length > 0 ? 'مؤجر' : 'شاغر'}
                </span>
              </div>
              <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 4 }}>{fieldOf(ownerRec.data,'property')||ownerRec.name}</h3>
              <div style={{ color: '#8b94a3', fontSize: 12.5, marginBottom: 14 }}>{fieldOf(ownerRec.data,'propertyType')} — {fieldOf(ownerRec.data,'property')}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #2a3142', fontSize: 13 }}>
                <span style={{ color: '#8b94a3' }}>الإيجار الشهري</span>
                <span style={{ fontWeight: 600, color: '#d4a574' }}>{fieldOf(ownerRec.data,'rent')} ر.س</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #2a3142', fontSize: 13 }}>
                <span style={{ color: '#8b94a3' }}>العمولة</span>
                <span>{fieldOf(ownerRec.data,'commission')}%</span>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState icon="🏠" msg="لم يتم تسجيل عقارات باسمك بعد" />
        )}

        <SecTitle>طلباتك وملاحظاتك</SecTitle>
        <div style={{ display: 'grid', gap: 10, marginBottom: 32 }}>
          {ownerRequests.length === 0 ? <EmptyState icon="📋" msg="لم تقدم أي طلبات بعد. اضغط على زر + لإضافة طلب جديد" /> :
            ownerRequests.map(r => (
              <div key={r.id} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRight: `3px solid ${r.status === 'done' ? '#5fb878' : '#f0c674'}`, borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</span>
                  <span style={{ fontSize: 11, color: r.status === 'done' ? '#5fb878' : '#f0c674' }}>{r.status === 'done' ? 'منجز' : 'قيد المعالجة'}</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#8b94a3' }}>{r.desc}</div>
                {r.adminResponse && <div style={{ marginTop: 8, fontSize: 12.5, background: 'rgba(95,184,120,0.08)', border: '1px solid rgba(95,184,120,0.2)', borderRadius: 8, padding: '8px 12px', color: '#5fb878' }}>رد الشركة: {r.adminResponse}</div>}
              </div>
            ))
          }
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setOpenModal('new-request')} style={{ position: 'fixed', bottom: 28, left: 28, width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', color: '#0e1116', fontSize: 24, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,165,116,0.4)' }}>+</button>

      {openModal === 'new-request' && (
        <ModalWrap title="طلب جديد" sub="أرسل طلب صيانة أو استفسار للشركة" onClose={() => setOpenModal(null)}>
          <Field label="عنوان الطلب"><input style={S.input()} value={reqForm.title} onChange={e => setReqForm(f => ({...f, title: e.target.value}))} placeholder="مثال: تسرب في الحمام" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="النوع">
              <select style={S.input()} value={reqForm.type} onChange={e => setReqForm(f => ({...f, type: e.target.value}))}>
                {['صيانة','استفسار مالي','شكوى مستأجر','طلب وثيقة','أخرى'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="الأولوية">
              <select style={S.input()} value={reqForm.priority} onChange={e => setReqForm(f => ({...f, priority: e.target.value}))}>
                {['عاجل','عالية','متوسطة','منخفضة'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>
          <Field label="التفاصيل"><textarea style={{ ...S.input(), minHeight: 80, resize: 'vertical' }} value={reqForm.desc} onChange={e => setReqForm(f => ({...f, desc: e.target.value}))} /></Field>
          <ModalActions><button style={S.btn()} onClick={addRequest}>إرسال الطلب</button><button style={S.btn('secondary')} onClick={() => setOpenModal(null)}>إلغاء</button></ModalActions>
        </ModalWrap>
      )}
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // MAIN APP (Partner)
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#0e1116', color: '#e8eaed', fontFamily: 'Tajawal, sans-serif', backgroundImage: 'radial-gradient(circle at 20% 10%,rgba(212,165,116,0.06) 0%,transparent 40%),radial-gradient(circle at 80% 90%,rgba(212,165,116,0.04) 0%,transparent 40%)' }}>
      {/* HEADER */}
      <header style={{ borderBottom: '1px solid #2a3142', background: 'rgba(14,17,22,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: 10, display: 'grid', placeItems: 'center', fontFamily: 'Reem Kufi', fontWeight: 700, color: '#0e1116', fontSize: 20 }}>P</div>
            <div><div style={{ fontFamily: 'Reem Kufi', fontSize: 19, fontWeight: 600 }}>Property Hub</div><div style={{ fontSize: 11, color: '#8b94a3' }}>نظام إدارة الأملاك</div></div>
          </div>
          <nav>
            <ul style={{ display: 'flex', listStyle: 'none', gap: 4, flexWrap: 'wrap' }}>
              {([
                ['dashboard','لوحة التحكم'],
                ['records','السجلات'],
                ['owners-mgmt','بوابة الملاك'],
                ['marketing','التسويق والمتابعة'],
                ['alerts','التنبيهات'],
                ['reports','التقارير'],
                ['settings','الإعدادات'],
              ] as [Page, string][]).map(([id, label]) => (
                <li key={id}><button onClick={() => setCurrentPage(id)} style={{ padding: '8px 14px', color: currentPage === id ? '#d4a574' : '#8b94a3', background: currentPage === id ? 'rgba(212,165,116,0.1)' : 'transparent', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Tajawal', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {label}
                  {id === 'marketing' && pendingLeads > 0 && <span style={{ background: '#e56b6f', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: 10 }}>{pendingLeads}</span>}
                  {id === 'alerts' && alerts.length > 0 && <span style={{ background: '#e56b6f', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: 10 }}>{alerts.length}</span>}
                </button></li>
              ))}
            </ul>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px 6px 14px', background: '#1c2230', border: '1px solid #2a3142', borderRadius: 30, fontSize: 13 }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#d4a574,#e8c9a0)', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#0e1116', fontWeight: 700, fontSize: 12 }}>{currentUser?.name?.charAt(0)}</div>
            <span>{currentUser?.name}</span>
            <button onClick={logout} style={{ background: 'transparent', border: 'none', color: '#8b94a3', cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}>خروج</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 28 }}>

        {/* ═══ DASHBOARD ═══ */}
        {currentPage === 'dashboard' && (
          <div>
            <div style={{ marginBottom: 28 }}><h1 style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 600, marginBottom: 6 }}>أهلاً بك، {currentUser?.name}</h1><p style={{ color: '#8b94a3', fontSize: 14 }}>اختر القالب المناسب لتسجيل بيانات جديدة، أو راجع السجلات المحفوظة</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 32 }}>
              {[
                { label: 'إجمالي الملاك', value: ownerRecs.length, trend: 'عقارات مدارة' },
                { label: 'المستأجرين', value: tenantRecs.length, trend: 'عقود نشطة' },
                { label: 'عقود الشركاء', value: companyRecs.length, trend: 'اتفاقيات داخلية' },
                { label: 'عملاء التسويق', value: leads.length, trend: `${pendingLeads} بانتظار التواصل` },
              ].map((s, i) => (
                <div key={i} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle,rgba(212,165,116,0.08),transparent 70%)' }} />
                  <div style={{ fontSize: 11, color: '#8b94a3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Reem Kufi', fontSize: 28, fontWeight: 600 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: i === 3 && pendingLeads > 0 ? '#e56b6f' : '#5fb878', marginTop: 4 }}>{s.trend}</div>
                </div>
              ))}
            </div>

            <SecTitle>القوالب المتاحة</SecTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 36 }}>
              {[
                { type: 'owner' as const, icon: '🏠', iconBg: 'rgba(95,184,120,0.15)', iconColor: '#5fb878', title: 'قالب المالك', desc: 'تسجيل بيانات مالك العقار، تفاصيل العقار، شروط الإدارة، والعمولة المتفق عليها', fields: '12 حقل' },
                { type: 'tenant' as const, icon: '🔑', iconBg: 'rgba(240,198,116,0.15)', iconColor: '#f0c674', title: 'قالب المستأجر', desc: 'عقد إيجار شامل مع المستأجر، مدة العقد، قيمة الإيجار، وآلية الدفع', fields: '12 حقل' },
                { type: 'company' as const, icon: '🤝', iconBg: 'rgba(212,165,116,0.15)', iconColor: '#d4a574', title: 'قالب الشركة والشركاء', desc: 'اتفاقية داخلية، الحصص، الأدوار، توزيع الأرباح، وآليات اتخاذ القرار', fields: '10 حقل' },
              ].map(c => (
                <div key={c.type} onClick={() => setOpenModal(c.type)} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 22, cursor: 'pointer', transition: 'all 0.25s', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d4a574'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3142'; (e.currentTarget as HTMLDivElement).style.transform = '' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: c.iconBg, display: 'grid', placeItems: 'center', marginBottom: 14, fontSize: 22 }}>{c.icon}</div>
                  <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 17, marginBottom: 5 }}>{c.title}</h3>
                  <p style={{ color: '#8b94a3', fontSize: 12.5, marginBottom: 14, lineHeight: 1.6 }}>{c.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #2a3142', fontSize: 11, color: '#8b94a3' }}>
                    <span style={{ background: 'rgba(212,165,116,0.12)', color: '#d4a574', padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 500 }}>{c.fields}</span>
                    <span>← ابدأ الآن</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ RECORDS ═══ */}
        {currentPage === 'records' && (
          <div>
            <div style={{ marginBottom: 28 }}><h1 style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 600, marginBottom: 6 }}>السجلات</h1><p style={{ color: '#8b94a3', fontSize: 14 }}>عرض كل السجلات المحفوظة، يمكنك تصدير أي عقد كملف PDF</p></div>
            <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a3142', flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 15 }}>كل السجلات</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['all','owner','tenant','company'] as const).map(f => (
                    <button key={f} onClick={() => setRecordFilter(f)} style={{ padding: '5px 12px', background: recordFilter === f ? '#d4a574' : '#161a22', border: '1px solid', borderColor: recordFilter === f ? '#d4a574' : '#2a3142', borderRadius: 20, fontSize: 12, cursor: 'pointer', color: recordFilter === f ? '#0e1116' : '#8b94a3', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
                      {{all:'الكل',owner:'الملاك',tenant:'المستأجرين',company:'الشركاء'}[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead><tr style={{ background: '#161a22' }}>
                    {['النوع','الاسم','التفاصيل','التاريخ','إجراءات'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'right', color: '#8b94a3', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr><td colSpan={5}><EmptyState icon="📋" msg="لا توجد سجلات" /></td></tr>
                    ) : filteredRecords.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #2a3142', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '12px 20px' }}><span style={S.tag(r.type)}>{{owner:'مالك',tenant:'مستأجر',company:'شريك'}[r.type]}</span></td>
                        <td style={{ padding: '12px 20px', fontWeight: 500 }}>{r.name}</td>
                        <td style={{ padding: '12px 20px', color: '#8b94a3' }}>{r.details}</td>
                        <td style={{ padding: '12px 20px', color: '#8b94a3' }}>{r.date}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <button onClick={() => deleteRec(r.id)} style={{ background: 'transparent', border: '1px solid #2a3142', color: '#e56b6f', padding: '5px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontFamily: 'Tajawal' }}>حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ OWNERS MGMT ═══ */}
        {currentPage === 'owners-mgmt' && (
          <div>
            <div style={{ marginBottom: 28 }}><h1 style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 600, marginBottom: 6 }}>بوابة الملاك</h1><p style={{ color: '#8b94a3', fontSize: 14 }}>إدارة حسابات الملاك، إنشاء بيانات دخول، ومراجعة طلبات الصيانة</p></div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button style={S.btn()} onClick={() => setOpenModal('create-owner')}>+ إنشاء حساب لمالك</button>
              <button style={S.btn('secondary')} onClick={() => setCurrentPage('alerts')}>📋 طلبات الصيانة {requests.filter(r => r.status === 'pending').length > 0 && <span style={{ background: '#e56b6f', color: '#fff', padding: '1px 7px', borderRadius: 10, fontSize: 10, marginRight: 4 }}>{requests.filter(r => r.status === 'pending').length}</span>}</button>
            </div>
            <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a3142' }}>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 15 }}>حسابات الملاك</h3>
                <span style={{ color: '#8b94a3', fontSize: 12 }}>{ownerAccounts.length} حساب</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead><tr style={{ background: '#161a22' }}>
                    {['الاسم','طريقة الدخول','بيانات الدخول','إجراءات'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'right', color: '#8b94a3', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {ownerAccounts.length === 0 ? (
                      <tr><td colSpan={4}><EmptyState icon="👥" msg="لا توجد حسابات ملاك بعد" /></td></tr>
                    ) : ownerAccounts.map((o, i) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #2a3142', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500 }}>{o.ownerName}</td>
                        <td style={{ padding: '12px 20px', color: '#8b94a3' }}>{o.loginMethod === 'account' ? 'حساب' : 'رمز خاص'}</td>
                        <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 12 }}>
                          {o.loginMethod === 'account' ? `${o.username} / ${o.password}` : o.code}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <button onClick={() => deleteOwnerAccount(o.id)} style={{ background: 'transparent', border: '1px solid rgba(229,107,111,0.3)', color: '#e56b6f', padding: '5px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontFamily: 'Tajawal' }}>حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maintenance requests */}
            {requests.length > 0 && (
              <>
                <div style={{ marginTop: 28, marginBottom: 16 }}><SecTitle>طلبات الصيانة والاستفسارات</SecTitle></div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {requests.map(r => (
                    <div key={r.id} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRight: `3px solid ${r.priority === 'عاجل' ? '#e56b6f' : '#f0c674'}`, borderRadius: 10, padding: '14px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{r.title}</div>
                          <div style={{ fontSize: 12.5, color: '#8b94a3' }}>{r.ownerName} · {r.type} · {r.priority}</div>
                        </div>
                        <span style={{ fontSize: 12, color: r.status === 'done' ? '#5fb878' : '#f0c674' }}>{r.status === 'done' ? 'منجز ✓' : 'قيد المعالجة'}</span>
                      </div>
                      {r.desc && <div style={{ fontSize: 12.5, color: '#8b94a3', marginBottom: 8 }}>{r.desc}</div>}
                      {r.status !== 'done' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input style={{ ...S.input(), flex: 1, fontSize: 12 }} placeholder="رد على الطلب..." id={`resp-${r.id}`} />
                          <button onClick={() => { const v = (document.getElementById(`resp-${r.id}`) as HTMLInputElement)?.value; if (v) respondRequest(r.id, v) }} style={{ ...S.btn(), padding: '8px 16px', fontSize: 12 }}>رد</button>
                        </div>
                      )}
                      {r.adminResponse && <div style={{ marginTop: 6, fontSize: 12, color: '#5fb878' }}>رد الشركة: {r.adminResponse}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ MARKETING ═══ */}
        {currentPage === 'marketing' && (
          <div>
            <div style={{ marginBottom: 28 }}><h1 style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 600, marginBottom: 6 }}>التسويق والمتابعة</h1><p style={{ color: '#8b94a3', fontSize: 14 }}>إدارة العملاء المحتملين، حالة التواصل، والملاحظات السرية الخاصة بالشركاء</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'إجمالي العملاء', value: leads.length, color: '#e8eaed' },
                { label: 'بانتظار التواصل', value: pendingLeads, color: '#e56b6f' },
                { label: 'تم التواصل', value: contactedLeads, color: '#5fb878' },
                { label: 'قيد المتابعة', value: followingLeads, color: '#f0c674' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle,rgba(212,165,116,0.08),transparent 70%)' }} />
                  <div style={{ fontSize: 11, color: '#8b94a3', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Reem Kufi', fontSize: 28, fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Add lead form */}
            <div style={S.card()}>
              <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 8 }}>إضافة عميل جديد</h3>
              <p style={{ fontSize: 13, color: '#8b94a3', marginBottom: 14 }}>أضف عميل محتمل بسرعة مع ملاحظة خاصة بالشركاء</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="اسم العميل"><input style={S.input()} value={leadForm.name} onChange={e => setLeadForm(f => ({...f, name: e.target.value}))} placeholder="مثال: فهد السليمان" /></Field>
                <Field label="رقم الجوال"><input style={S.input()} value={leadForm.phone} onChange={e => setLeadForm(f => ({...f, phone: e.target.value}))} placeholder="05xxxxxxxx" /></Field>
                <Field label="حالة التواصل">
                  <select style={S.input()} value={leadForm.status} onChange={e => setLeadForm(f => ({...f, status: e.target.value}))}>
                    <option value="pending">لم يتم التواصل</option>
                    <option value="contacted">تم التواصل</option>
                    <option value="following">قيد المتابعة</option>
                    <option value="closed">مغلق - غير مهتم</option>
                    <option value="converted">تحول لعميل</option>
                  </select>
                </Field>
                <Field label="المصدر">
                  <select style={S.input()} value={leadForm.source} onChange={e => setLeadForm(f => ({...f, source: e.target.value}))}>
                    {['توصية شخصية','مكالمة مباشرة','تويتر / X','انستقرام','سناب شات','إعلان ممول','موقع الويب','أخرى'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <div style={{ gridColumn: '1/-1' }}>
                  <Field label="ملاحظة سرية (للشركاء فقط) 🔒"><textarea style={{ ...S.input(), minHeight: 80, resize: 'vertical' }} value={leadForm.notes} onChange={e => setLeadForm(f => ({...f, notes: e.target.value}))} placeholder="مثال: يريد إدارة 5 شقق في حي الراكية..." /></Field>
                </div>
              </div>
              <button style={{ ...S.btn(), marginTop: 14 }} onClick={addLead}>+ إضافة العميل</button>
            </div>

            {/* Leads table */}
            <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a3142', flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 15 }}>قائمة العملاء</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['all','pending','contacted','following','converted'].map(f => (
                    <button key={f} onClick={() => setLeadFilter(f)} style={{ padding: '5px 12px', background: leadFilter === f ? '#d4a574' : '#161a22', border: '1px solid', borderColor: leadFilter === f ? '#d4a574' : '#2a3142', borderRadius: 20, fontSize: 12, cursor: 'pointer', color: leadFilter === f ? '#0e1116' : '#8b94a3', fontFamily: 'Tajawal' }}>
                      {{all:'الكل',pending:'بانتظار التواصل',contacted:'تم التواصل',following:'قيد المتابعة',converted:'عملاء'}[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead><tr style={{ background: '#161a22' }}>
                    {['الاسم','الجوال','المصدر','الحالة','التاريخ','إجراءات'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'right', color: '#8b94a3', fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr><td colSpan={6}><EmptyState icon="📊" msg="لا يوجد عملاء بعد. ابدأ بإضافة عميل!" /></td></tr>
                    ) : filteredLeads.map((l, i) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #2a3142', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '12px 20px', fontWeight: 500 }}>{l.name}</td>
                        <td style={{ padding: '12px 20px', color: '#8b94a3', fontFamily: 'monospace' }}>{l.phone}</td>
                        <td style={{ padding: '12px 20px', color: '#8b94a3' }}>{l.source}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <select value={l.status} onChange={e => updateLeadStatus(l.id, e.target.value)} style={{ background: `${leadStatusColor[l.status]}18`, border: `1px solid ${leadStatusColor[l.status]}44`, color: leadStatusColor[l.status], padding: '3px 8px', borderRadius: 20, fontSize: 11, fontFamily: 'Tajawal', cursor: 'pointer', outline: 'none' }}>
                            {Object.entries(leadStatusLabel).map(([v,k]) => <option key={v} value={v} style={{ background: '#1c2230', color: '#e8eaed' }}>{k}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '12px 20px', color: '#8b94a3', fontSize: 12 }}>{new Date(l.createdAt).toLocaleDateString('ar-SA')}</td>
                        <td style={{ padding: '12px 20px' }}><button onClick={() => deleteLead(l.id)} style={{ background: 'transparent', border: '1px solid rgba(229,107,111,0.3)', color: '#e56b6f', padding: '5px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontFamily: 'Tajawal' }}>حذف</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ALERTS ═══ */}
        {currentPage === 'alerts' && (
          <div>
            <div style={{ marginBottom: 28 }}><h1 style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 600, marginBottom: 6 }}>التنبيهات</h1><p style={{ color: '#8b94a3', fontSize: 14 }}>عقود قاربت على الانتهاء، أو تحتاج متابعة عاجلة</p></div>
            {alerts.length === 0 ? <EmptyState icon="✓" msg="لا توجد تنبيهات حالية" /> : (
              <div style={{ display: 'grid', gap: 10 }}>
                {alerts.map(({ r, days }) => (
                  <div key={r.id} style={{ background: '#1c2230', border: '1px solid #2a3142', borderRight: `3px solid ${days < 0 || days <= 30 ? '#e56b6f' : '#f0c674'}`, padding: '14px 18px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
                        {days < 0 ? `عقد ${r.name} منتهي` : `عقد ${r.name} ${days <= 30 ? 'ينتهي قريباً' : 'يحتاج متابعة'}`}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#8b94a3' }}>{fieldOf(r.data,'property')||'غير محدد'}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: days < 0 || days <= 30 ? '#e56b6f' : '#f0c674' }}>
                      {days < 0 ? 'منتهي' : `${days} يوم متبقي`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ REPORTS ═══ */}
        {currentPage === 'reports' && (
          <div>
            <div style={{ marginBottom: 28 }}><h1 style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 600, marginBottom: 6 }}>التقارير والإحصائيات</h1><p style={{ color: '#8b94a3', fontSize: 14 }}>نظرة عامة على أداء الشركة وتوزيع المحفظة</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* Distribution */}
              <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 22 }}>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 16 }}>توزيع السجلات</h3>
                {[
                  { label: 'ملاك', value: ownerRecs.length, color: '#5fb878' },
                  { label: 'مستأجرين', value: tenantRecs.length, color: '#f0c674' },
                  { label: 'شركاء', value: companyRecs.length, color: '#d4a574' },
                ].map(item => {
                  const total = records.length || 1
                  return (
                    <div key={item.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span>{item.label}</span>
                        <span style={{ color: item.color }}>{item.value} ({Math.round(item.value/total*100)}%)</span>
                      </div>
                      <div style={{ height: 8, background: '#2a3142', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(item.value/total*100)}%`, background: item.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Financial Summary */}
              <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 22 }}>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 16 }}>الملخص المالي</h3>
                {[
                  { label: 'إجمالي الإيجارات الشهرية', value: tenantRecs.reduce((s, r) => s + (parseFloat(fieldOf(r.data,'rent'))||0), 0) },
                  { label: 'إجمالي إيجارات الملاك', value: ownerRecs.reduce((s, r) => s + (parseFloat(fieldOf(r.data,'rent'))||0), 0) },
                  { label: 'إجمالي المساهمات', value: companyRecs.reduce((s, r) => s + (parseFloat(fieldOf(r.data,'investment'))||0), 0) },
                  { label: 'متوسط العمولة', value: ownerRecs.length > 0 ? ownerRecs.reduce((s, r) => s + (parseFloat(fieldOf(r.data,'commission'))||0), 0) / ownerRecs.length : 0, suffix: '%', noFixed: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #2a3142', fontSize: 13.5 }}>
                    <span style={{ color: '#8b94a3' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: '#d4a574' }}>{row.noFixed ? `${row.value.toFixed(1)}${row.suffix||''}` : `${row.value.toLocaleString('ar-SA')} ر.س`}</span>
                  </div>
                ))}
              </div>

              {/* Leads funnel */}
              <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 22 }}>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 16 }}>قمع التسويق</h3>
                {[
                  { label: 'إجمالي العملاء', value: leads.length, color: '#6eb5ff' },
                  { label: 'تم التواصل', value: contactedLeads + followingLeads, color: '#f0c674' },
                  { label: 'قيد المتابعة', value: followingLeads, color: '#d4a574' },
                  { label: 'تحولوا لعملاء', value: leads.filter(l => l.status === 'converted').length, color: '#5fb878' },
                ].map(item => {
                  const max = leads.length || 1
                  return (
                    <div key={item.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span>{item.label}</span>
                        <span style={{ color: item.color, fontFamily: 'Reem Kufi' }}>{item.value}</span>
                      </div>
                      <div style={{ height: 8, background: '#2a3142', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(item.value/max*100)}%`, background: item.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Property types */}
              <div style={{ background: '#1c2230', border: '1px solid #2a3142', borderRadius: 14, padding: 22 }}>
                <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 16 }}>أنواع العقارات</h3>
                {(() => {
                  const types: Record<string, number> = {}
                  ownerRecs.forEach(r => { const t = fieldOf(r.data,'propertyType')||'أخرى'; types[t] = (types[t]||0)+1 })
                  const max = Math.max(...Object.values(types), 1)
                  return Object.entries(types).map(([t, v]) => (
                    <div key={t} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span>{t}</span>
                        <span style={{ color: '#d4a574', fontFamily: 'Reem Kufi' }}>{v}</span>
                      </div>
                      <div style={{ height: 8, background: '#2a3142', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round(v/max*100)}%`, background: '#d4a574', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))
                })()}
                {ownerRecs.length === 0 && <EmptyState icon="🏠" msg="لا توجد عقارات مسجلة بعد" />}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {currentPage === 'settings' && (
          <div>
            <div style={{ marginBottom: 28 }}><h1 style={{ fontFamily: 'Reem Kufi', fontSize: 32, fontWeight: 600, marginBottom: 6 }}>الإعدادات</h1><p style={{ color: '#8b94a3', fontSize: 14 }}>إدارة الحسابات والشركاء وأمان النظام</p></div>

            <div style={S.card()}>
              <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 8 }}>الشركاء والمستخدمين</h3>
              <p style={{ fontSize: 13, color: '#8b94a3', marginBottom: 14 }}>جميع الأشخاص الذين لديهم وصول للنظام</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {users.map(u => (
                  <div key={u.id} style={{ background: '#161a22', padding: '12px 16px', borderRadius: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: 2 }}>{u.name}</strong>
                      <span style={{ color: '#8b94a3', fontSize: 12 }}>@{u.username}</span>
                    </div>
                    <span style={{ background: 'rgba(212,165,116,0.15)', color: '#d4a574', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>{u.role === 'partner' ? 'شريك' : 'مدير'}</span>
                  </div>
                ))}
                {users.length === 0 && <EmptyState icon="👥" msg="لا توجد حسابات بعد" />}
              </div>
            </div>

            <div style={S.card()}>
              <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 8 }}>الرمز السري للشركة</h3>
              <p style={{ fontSize: 13, color: '#8b94a3', marginBottom: 14 }}>مطلوب لإنشاء حسابات جديدة. شاركه فقط مع الشركاء الموثوقين.</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input readOnly value={showCodePlain ? companyCode : '••••••••••••'} style={{ ...S.input(), maxWidth: 300 }} />
                <button style={S.btn('secondary')} onClick={() => setShowCodePlain(v => !v)}>إظهار / إخفاء</button>
                <button style={S.btn()} onClick={() => { const c = 'QLIVN-' + uid().toUpperCase(); setCompanyCode(c); save('ph_company_code', c); showToast('تم تغيير الرمز السري') }}>تغيير الرمز</button>
              </div>
            </div>

            <div style={S.card()}>
              <h3 style={{ fontFamily: 'Reem Kufi', fontSize: 16, marginBottom: 8 }}>النسخ الاحتياطي للبيانات</h3>
              <p style={{ fontSize: 13, color: '#8b94a3', marginBottom: 14 }}>صدّر كل البيانات كملف JSON واحفظه على جهازك.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={S.btn()} onClick={() => {
                  const data = { users, records, ownerAccounts, leads, requests, companyCode, exportedAt: new Date().toISOString() }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'property-hub-backup.json'; a.click()
                }}>📥 تصدير (نسخ)</button>
                <button style={S.btn('secondary')} onClick={() => document.getElementById('importFile')?.click()}>📁 استيراد من ملف</button>
                <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => {
                    try {
                      const d = JSON.parse(ev.target?.result as string)
                      if (d.users) { setUsers(d.users); save('ph_users', d.users) }
                      if (d.records) { setRecords(d.records); save('ph_records', d.records) }
                      if (d.ownerAccounts) { setOwnerAccounts(d.ownerAccounts); save('ph_owner_accounts', d.ownerAccounts) }
                      if (d.leads) { setLeads(d.leads); save('ph_leads', d.leads) }
                      if (d.requests) { setRequests(d.requests); save('ph_requests', d.requests) }
                      if (d.companyCode) { setCompanyCode(d.companyCode); save('ph_company_code', d.companyCode) }
                      showToast('تم الاستيراد بنجاح')
                    } catch { showToast('ملف غير صالح', true) }
                  }
                  reader.readAsText(file)
                }} />
              </div>
              <p style={{ fontSize: 11.5, color: '#f0c674', marginTop: 10 }}>💡 على الجوال: استخدم "تصدير" والصق النتيجة في ملاحظات الجوال أو واتساب لنفسك.</p>
            </div>
          </div>
        )}

      </div>

      {/* ═══ MODALS ═══ */}

      {/* Owner form */}
      {openModal === 'owner' && (
        <ModalWrap title="قالب المالك" sub="تسجيل بيانات مالك العقار وشروط الإدارة" onClose={() => setOpenModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="الاسم الكامل"><input style={S.input()} value={ownerForm.name||''} onChange={e => setOwnerForm(f => ({...f, name: e.target.value}))} placeholder="مثال: محمد عبدالله السالم" /></Field>
            <Field label="رقم الهوية"><input style={S.input()} value={ownerForm.id||''} onChange={e => setOwnerForm(f => ({...f, id: e.target.value}))} placeholder="1xxxxxxxxx" /></Field>
            <Field label="رقم الجوال"><input style={S.input()} value={ownerForm.phone||''} onChange={e => setOwnerForm(f => ({...f, phone: e.target.value}))} placeholder="05xxxxxxxx" /></Field>
            <Field label="البريد الإلكتروني"><input style={S.input()} value={ownerForm.email||''} onChange={e => setOwnerForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" /></Field>
            <div style={{ gridColumn: '1/-1' }}><Field label="عنوان العقار"><input style={S.input()} value={ownerForm.property||''} onChange={e => setOwnerForm(f => ({...f, property: e.target.value}))} placeholder="الحي، الشارع، المدينة" /></Field></div>
            <Field label="نوع العقار"><select style={S.input()} value={ownerForm.propertyType||'شقة'} onChange={e => setOwnerForm(f => ({...f, propertyType: e.target.value}))}>{['شقة','فيلا','دور','عمارة كاملة','محل تجاري'].map(o => <option key={o}>{o}</option>)}</select></Field>
            <Field label="رقم الصك"><input style={S.input()} value={ownerForm.deed||''} onChange={e => setOwnerForm(f => ({...f, deed: e.target.value}))} /></Field>
            <Field label="الإيجار الشهري (ر.س)"><input style={S.input()} type="number" value={ownerForm.rent||''} onChange={e => setOwnerForm(f => ({...f, rent: e.target.value}))} placeholder="0" /></Field>
            <Field label="نسبة العمولة (%)"><input style={S.input()} type="number" value={ownerForm.commission||''} onChange={e => setOwnerForm(f => ({...f, commission: e.target.value}))} placeholder="8" /></Field>
            <Field label="تاريخ بداية الإدارة"><input style={S.input()} type="date" value={ownerForm.startDate||''} onChange={e => setOwnerForm(f => ({...f, startDate: e.target.value}))} /></Field>
            <Field label="مدة العقد (سنة)"><input style={S.input()} type="number" value={ownerForm.duration||''} onChange={e => setOwnerForm(f => ({...f, duration: e.target.value}))} placeholder="1" /></Field>
            <div style={{ gridColumn: '1/-1' }}><Field label="شروط خاصة"><textarea style={{ ...S.input(), minHeight: 70, resize: 'vertical' }} value={ownerForm.notes||''} onChange={e => setOwnerForm(f => ({...f, notes: e.target.value}))} /></Field></div>
          </div>
          <ModalActions><button style={S.btn()} onClick={() => saveRec('owner')}>حفظ السجل</button><button style={S.btn('secondary')} onClick={() => setOpenModal(null)}>إلغاء</button></ModalActions>
        </ModalWrap>
      )}

      {/* Tenant form */}
      {openModal === 'tenant' && (
        <ModalWrap title="قالب المستأجر" sub="عقد إيجار مع المستأجر" onClose={() => setOpenModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="الاسم الكامل"><input style={S.input()} value={tenantForm.name||''} onChange={e => setTenantForm(f => ({...f, name: e.target.value}))} /></Field>
            <Field label="رقم الهوية / الإقامة"><input style={S.input()} value={tenantForm.id||''} onChange={e => setTenantForm(f => ({...f, id: e.target.value}))} /></Field>
            <Field label="الجنسية"><input style={S.input()} value={tenantForm.nationality||''} onChange={e => setTenantForm(f => ({...f, nationality: e.target.value}))} /></Field>
            <Field label="رقم الجوال"><input style={S.input()} value={tenantForm.phone||''} onChange={e => setTenantForm(f => ({...f, phone: e.target.value}))} placeholder="05xxxxxxxx" /></Field>
            <div style={{ gridColumn: '1/-1' }}><Field label="جهة العمل"><input style={S.input()} value={tenantForm.work||''} onChange={e => setTenantForm(f => ({...f, work: e.target.value}))} /></Field></div>
            <div style={{ gridColumn: '1/-1' }}><Field label="العقار المؤجر"><input style={S.input()} value={tenantForm.property||''} onChange={e => setTenantForm(f => ({...f, property: e.target.value}))} /></Field></div>
            <Field label="الإيجار السنوي (ر.س)"><input style={S.input()} type="number" value={tenantForm.rent||''} onChange={e => setTenantForm(f => ({...f, rent: e.target.value}))} placeholder="0" /></Field>
            <Field label="طريقة السداد"><select style={S.input()} value={tenantForm.payment||'شهري'} onChange={e => setTenantForm(f => ({...f, payment: e.target.value}))}>{['شهري','ربع سنوي','نصف سنوي','سنوي'].map(o => <option key={o}>{o}</option>)}</select></Field>
            <Field label="قيمة التأمين (ر.س)"><input style={S.input()} type="number" value={tenantForm.deposit||''} onChange={e => setTenantForm(f => ({...f, deposit: e.target.value}))} /></Field>
            <Field label="تاريخ بداية العقد"><input style={S.input()} type="date" value={tenantForm.startDate||''} onChange={e => setTenantForm(f => ({...f, startDate: e.target.value}))} /></Field>
            <Field label="تاريخ نهاية العقد"><input style={S.input()} type="date" value={tenantForm.endDate||''} onChange={e => setTenantForm(f => ({...f, endDate: e.target.value}))} /></Field>
            <div style={{ gridColumn: '1/-1' }}><Field label="شروط إضافية"><textarea style={{ ...S.input(), minHeight: 70, resize: 'vertical' }} value={tenantForm.notes||''} onChange={e => setTenantForm(f => ({...f, notes: e.target.value}))} /></Field></div>
          </div>
          <ModalActions><button style={S.btn()} onClick={() => saveRec('tenant')}>حفظ العقد</button><button style={S.btn('secondary')} onClick={() => setOpenModal(null)}>إلغاء</button></ModalActions>
        </ModalWrap>
      )}

      {/* Company form */}
      {openModal === 'company' && (
        <ModalWrap title="قالب الشركة والشركاء" sub="اتفاقية بين الشركاء" onClose={() => setOpenModal(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}><Field label="اسم الشركة"><input style={S.input()} value={companyForm.company||''} onChange={e => setCompanyForm(f => ({...f, company: e.target.value}))} /></Field></div>
            <Field label="السجل التجاري"><input style={S.input()} value={companyForm.cr||''} onChange={e => setCompanyForm(f => ({...f, cr: e.target.value}))} /></Field>
            <Field label="تاريخ التأسيس"><input style={S.input()} type="date" value={companyForm.founded||''} onChange={e => setCompanyForm(f => ({...f, founded: e.target.value}))} /></Field>
            <div style={{ gridColumn: '1/-1' }}><Field label="اسم الشريك"><input style={S.input()} value={companyForm.partner||''} onChange={e => setCompanyForm(f => ({...f, partner: e.target.value}))} /></Field></div>
            <Field label="نسبة الحصة (%)"><input style={S.input()} type="number" value={companyForm.share||''} onChange={e => setCompanyForm(f => ({...f, share: e.target.value}))} placeholder="25" /></Field>
            <Field label="قيمة المساهمة (ر.س)"><input style={S.input()} type="number" value={companyForm.investment||''} onChange={e => setCompanyForm(f => ({...f, investment: e.target.value}))} placeholder="0" /></Field>
            <Field label="الدور / المنصب"><input style={S.input()} value={companyForm.role||''} onChange={e => setCompanyForm(f => ({...f, role: e.target.value}))} /></Field>
            <Field label="صلاحية اتخاذ القرار"><select style={S.input()} value={companyForm.authority||'منفرد'} onChange={e => setCompanyForm(f => ({...f, authority: e.target.value}))}>{['منفرد','بالأغلبية','بالإجماع'].map(o => <option key={o}>{o}</option>)}</select></Field>
            <div style={{ gridColumn: '1/-1' }}><Field label="آلية توزيع الأرباح"><textarea style={{ ...S.input(), minHeight: 70, resize: 'vertical' }} value={companyForm.profits||''} onChange={e => setCompanyForm(f => ({...f, profits: e.target.value}))} /></Field></div>
            <div style={{ gridColumn: '1/-1' }}><Field label="بنود إضافية"><textarea style={{ ...S.input(), minHeight: 70, resize: 'vertical' }} value={companyForm.notes||''} onChange={e => setCompanyForm(f => ({...f, notes: e.target.value}))} /></Field></div>
          </div>
          <ModalActions><button style={S.btn()} onClick={() => saveRec('company')}>حفظ الاتفاقية</button><button style={S.btn('secondary')} onClick={() => setOpenModal(null)}>إلغاء</button></ModalActions>
        </ModalWrap>
      )}

      {/* Create Owner Account */}
      {openModal === 'create-owner' && (
        <ModalWrap title="إنشاء حساب لمالك" sub="اختر المالك وحدد طريقة الدخول" onClose={() => setOpenModal(null)}>
          <div style={{ marginBottom: 14 }}>
            <span style={S.label()}>اختر المالك</span>
            <select style={S.input()} value={createOwnerForm.recordId} onChange={e => setCreateOwnerForm(f => ({...f, recordId: e.target.value}))}>
              <option value="">-- اختر من قائمة الملاك المسجلين --</option>
              {ownerRecs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <p style={{ fontSize: 11.5, color: '#8b94a3', marginTop: 5 }}>يجب تسجيل بيانات المالك أولاً في قسم "السجلات"</p>
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={S.label()}>طريقة الدخول</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(['account','link'] as const).map(m => (
                <button key={m} onClick={() => setCreateOwnerForm(f => ({...f, loginMethod: m}))} style={{ padding: 10, border: `1px solid ${createOwnerForm.loginMethod === m ? '#d4a574' : '#2a3142'}`, borderRadius: 9, textAlign: 'center', cursor: 'pointer', fontSize: 13, background: createOwnerForm.loginMethod === m ? 'rgba(212,165,116,0.1)' : '#1c2230', color: createOwnerForm.loginMethod === m ? '#d4a574' : '#e8eaed', fontFamily: 'Tajawal', transition: 'all 0.2s' }}>
                  {m === 'account' ? 'حساب (يوزر + باسوورد)' : 'رمز خاص (بدون باسوورد)'}
                </button>
              ))}
            </div>
          </div>
          {createOwnerForm.loginMethod === 'account' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="اسم المستخدم"><input style={S.input()} value={createOwnerForm.username} onChange={e => setCreateOwnerForm(f => ({...f, username: e.target.value}))} placeholder="يفضل رقم الجوال" /></Field>
              <Field label="كلمة المرور المبدئية"><input style={S.input()} value={createOwnerForm.password} onChange={e => setCreateOwnerForm(f => ({...f, password: e.target.value}))} placeholder="مثال: 1234abcd" /></Field>
            </div>
          )}
          {createOwnerForm.loginMethod === 'link' && (
            <p style={{ fontSize: 12, color: '#8b94a3', background: '#161a22', padding: '10px 14px', borderRadius: 8 }}>💡 سيتم توليد رمز خاص تلقائياً عند الإنشاء. أرسله للمالك ليدخل به مباشرة.</p>
          )}
          <ModalActions><button style={S.btn()} onClick={createOwnerAccount}>إنشاء الحساب</button><button style={S.btn('secondary')} onClick={() => setOpenModal(null)}>إلغاء</button></ModalActions>
        </ModalWrap>
      )}

      {/* Toast */}
      {toast.show && (
        <div style={{ position: 'fixed', bottom: 30, right: 30, background: '#161a22', border: `1px solid ${toast.err ? '#e56b6f' : '#5fb878'}`, borderRight: `4px solid ${toast.err ? '#e56b6f' : '#5fb878'}`, padding: '14px 22px', borderRadius: 10, fontSize: 13.5, zIndex: 300, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontFamily: 'Tajawal' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Small reusable components ──────────────────────────────────
function SecTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: 'Reem Kufi', fontSize: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 4, height: 20, background: '#d4a574', borderRadius: 2, display: 'inline-block' }} />{children}</h2>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 12.5, color: '#8b94a3', marginBottom: 5, fontWeight: 500 }}>{label}</label>{children}</div>
}
function ModalWrap({ title, sub, children, onClose }: { title: string; sub: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '30px 16px', overflowY: 'auto', fontFamily: 'Tajawal, sans-serif' }}>
      <div style={{ background: '#161a22', border: '1px solid #2a3142', borderRadius: 16, maxWidth: 720, width: '100%', padding: 28, margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid #2a3142' }}>
          <div><h2 style={{ fontFamily: 'Reem Kufi', fontSize: 20, marginBottom: 4, color: '#e8eaed' }}>{title}</h2><p style={{ color: '#8b94a3', fontSize: 12.5 }}>{sub}</p></div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #2a3142', color: '#8b94a3', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
function ModalActions({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, marginTop: 22, paddingTop: 18, borderTop: '1px solid #2a3142', flexWrap: 'wrap' }}>{children}</div>
}
function EmptyState({ icon, msg }: { icon: string; msg: string }) {
  return <div style={{ padding: '50px 20px', textAlign: 'center', color: '#8b94a3' }}><div style={{ fontSize: 40, marginBottom: 10, opacity: 0.4 }}>{icon}</div><div>{msg}</div></div>
}
