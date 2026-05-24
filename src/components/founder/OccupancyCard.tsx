import { getTypeIcon, getTypeLabel } from '@/lib/utils'

interface OccupancyCardProps {
  unitName: string
  unitType: string
  occupancyRate: number
  monthlyIncome: number
  status: string
}

export function OccupancyCard({
  unitName,
  unitType,
  occupancyRate,
  monthlyIncome,
  status,
}: OccupancyCardProps) {
  const rate = Math.min(100, Math.max(0, occupancyRate))
  const barColor =
    rate >= 75
      ? 'var(--success)'
      : rate >= 50
      ? 'var(--warning)'
      : 'var(--danger)'

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
            {unitName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {getTypeIcon(unitType)} {getTypeLabel(unitType)}
          </div>
        </div>
        <div
          style={{
            fontSize: '22px',
            fontFamily: 'Reem Kufi, sans-serif',
            fontWeight: 700,
            color: barColor,
          }}
        >
          {rate.toFixed(0)}%
        </div>
      </div>

      {/* Occupancy bar */}
      <div>
        <div
          style={{
            height: '6px',
            background: 'var(--border)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${rate}%`,
              background: barColor,
              borderRadius: '3px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '11px',
            color: 'var(--muted)',
          }}
        >
          <span>نسبة الإشغال</span>
          <span>{monthlyIncome.toLocaleString('ar-SA')} ر.س / شهر</span>
        </div>
      </div>
    </div>
  )
}
