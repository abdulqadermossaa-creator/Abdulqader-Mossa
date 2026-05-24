interface StatItem {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
}

interface StatsBarProps {
  stats: StatItem[]
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: '14px',
        marginBottom: '28px',
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '18px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '80px',
              height: '80px',
              background: 'radial-gradient(circle, rgba(212,165,116,0.08), transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              fontSize: '11px',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '6px',
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontFamily: 'Reem Kufi, sans-serif',
              fontSize: '28px',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            {stat.value}
          </div>
          {stat.trend && (
            <div
              style={{
                fontSize: '11px',
                color: stat.trendUp ? 'var(--success)' : 'var(--muted)',
                marginTop: '4px',
              }}
            >
              {stat.trend}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
