'use client'

interface RevenueItem {
  label: string
  value: number
  color: string
}

interface RevenueChartProps {
  items: RevenueItem[]
  title?: string
}

export function RevenueChart({ items, title }: RevenueChartProps) {
  const maxValue = Math.max(...items.map((i) => i.value), 1)

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
      }}
    >
      {title && (
        <div className="section-title" style={{ marginBottom: '20px' }}>
          {title}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
        {items.map((item, i) => {
          const heightPct = (item.value / maxValue) * 100
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              {/* Value label */}
              <div style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                {item.value.toLocaleString('ar-SA')}
              </div>
              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  minHeight: '4px',
                  background: item.color,
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.5s ease',
                  opacity: 0.85,
                }}
              />
              {/* Label */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  textAlign: 'center',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Source Breakdown ──────────────────────────────────────────

interface SourceBreakdownProps {
  gathern: number
  airbnb: number
  direct: number
}

export function SourceBreakdown({ gathern, airbnb, direct }: SourceBreakdownProps) {
  const total = gathern + airbnb + direct || 1
  const items = [
    { label: 'قاذرن', value: gathern, color: 'var(--success)', pct: (gathern / total) * 100 },
    { label: 'Airbnb', value: airbnb, color: 'var(--danger)', pct: (airbnb / total) * 100 },
    { label: 'مباشر', value: direct, color: 'var(--info)', pct: (direct / total) * 100 },
  ]

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
      }}
    >
      <div className="section-title" style={{ marginBottom: '16px' }}>
        توزيع المصادر
      </div>

      {/* Progress bar */}
      <div
        style={{
          display: 'flex',
          height: '12px',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '16px',
          gap: '2px',
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              width: `${item.pct}%`,
              background: item.color,
              transition: 'width 0.5s ease',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item.label}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                {item.pct.toFixed(0)}%
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                {item.value.toLocaleString('ar-SA')} ر.س
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
