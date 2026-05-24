'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface AddUnitModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    location: string
    type: string
    status: string
    welcome_message: string
  }) => void
}

export function AddUnitModal({ isOpen, onClose, onSave }: AddUnitModalProps) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState('villa')
  const [status, setStatus] = useState('active')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) {
      setError('الرجاء إدخال اسم المضيف')
      return
    }
    onSave({ name: name.trim(), location: location.trim(), type, status, welcome_message: welcomeMessage.trim() })
    // Reset
    setName('')
    setLocation('')
    setType('villa')
    setStatus('active')
    setWelcomeMessage('')
    setError('')
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    padding: '10px 13px',
    borderRadius: '9px',
    fontFamily: 'Tajawal, sans-serif',
    fontSize: '13.5px',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12.5px',
    color: 'var(--muted)',
    marginBottom: '5px',
    fontWeight: 500,
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="إضافة مضيف جديد"
      subtitle="Plug and Play — يشتغل من اللحظة الأولى بإعدادات افتراضية ذكية"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label style={labelStyle}>اسم العقار / المضيف</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="مثال: فيلا الياسمين"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
          />
        </div>
        <div>
          <label style={labelStyle}>الموقع</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="مثال: الرياض - النزهة"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>نوع العقار</label>
          <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="villa">فيلا 🏡</option>
            <option value="apartment">شقة 🏢</option>
            <option value="chalet">شاليه 🏕️</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>الحالة</label>
          <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">نشط ✅</option>
            <option value="inactive">غير نشط</option>
            <option value="maintenance">صيانة 🔧</option>
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>رسالة ترحيب مخصصة</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="مثال: أهلاً وسهلاً في فيلتنا المميزة"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '12.5px', marginTop: '10px' }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginTop: '22px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button className="btn-primary" onClick={handleSave}>
          إضافة المضيف
        </button>
        <button className="btn-secondary" onClick={handleClose}>
          إلغاء
        </button>
      </div>
    </Modal>
  )
}
