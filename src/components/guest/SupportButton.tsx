'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface SupportButtonProps {
  unitId: string
  guestName?: string
}

const ISSUE_TYPES = [
  { id: 'wifi', label: '📶 مشكلة في الواي فاي', icon: '📶' },
  { id: 'ac', label: '❄️ تكييف', icon: '❄️' },
  { id: 'water', label: '💧 مياه', icon: '💧' },
  { id: 'electricity', label: '💡 كهرباء', icon: '💡' },
  { id: 'cleanliness', label: '🧹 نظافة', icon: '🧹' },
  { id: 'noise', label: '🔊 ضوضاء', icon: '🔊' },
  { id: 'other', label: '❓ أخرى', icon: '❓' },
]

export function SupportButton({ unitId, guestName }: SupportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState('')
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!selectedIssue) return
    setSending(true)

    // Simulate sending request (in production, call Supabase or API)
    await new Promise((r) => setTimeout(r, 1200))

    setSending(false)
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setIsOpen(false)
      setSelectedIssue('')
      setNotes('')
    }, 2000)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          padding: '14px 20px',
          borderRadius: '12px',
          cursor: 'pointer',
          fontFamily: 'Tajawal, sans-serif',
          fontSize: '15px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text)'
        }}
      >
        🆘 طلب دعم
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="طلب دعم"
        subtitle="سنصلك في أقرب وقت ممكن"
        maxWidth="500px"
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--success)' }}>
              تم إرسال طلبك!
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
              سيتواصل معك فريقنا قريباً
            </div>
          </div>
        ) : (
          <>
            {guestName && (
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
                مرحباً {guestName}، اختر نوع المشكلة:
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              {ISSUE_TYPES.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue.id)}
                  style={{
                    background:
                      selectedIssue === issue.id
                        ? 'rgba(212,165,116,0.12)'
                        : 'var(--bg-card)',
                    border: `1px solid ${
                      selectedIssue === issue.id ? 'var(--accent)' : 'var(--border)'
                    }`,
                    color:
                      selectedIssue === issue.id ? 'var(--accent)' : 'var(--text)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontFamily: 'Tajawal, sans-serif',
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'right',
                    transition: 'all 0.2s',
                  }}
                >
                  {issue.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  color: 'var(--muted)',
                  marginBottom: '5px',
                }}
              >
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '10px 13px',
                  borderRadius: '9px',
                  fontFamily: 'Tajawal, sans-serif',
                  fontSize: '13.5px',
                  minHeight: '80px',
                  resize: 'vertical',
                }}
                placeholder="أي تفاصيل إضافية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={handleSend}
                disabled={!selectedIssue || sending}
                style={{
                  opacity: !selectedIssue ? 0.5 : 1,
                  cursor: !selectedIssue ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
              <button className="btn-secondary" onClick={() => setIsOpen(false)}>
                إلغاء
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
