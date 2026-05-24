import { getStatusLabel } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  showDot?: boolean
  size?: 'sm' | 'md'
}

const statusStyles: Record<string, { bg: string; color: string; dotBg: string }> = {
  active: {
    bg: 'rgba(95,184,120,0.12)',
    color: 'var(--success)',
    dotBg: 'var(--success)',
  },
  inactive: {
    bg: 'rgba(139,148,163,0.12)',
    color: 'var(--muted)',
    dotBg: 'var(--muted)',
  },
  maintenance: {
    bg: 'rgba(240,198,116,0.12)',
    color: 'var(--warning)',
    dotBg: 'var(--warning)',
  },
  cleaning: {
    bg: 'rgba(110,181,255,0.12)',
    color: 'var(--info)',
    dotBg: 'var(--info)',
  },
  upcoming: {
    bg: 'rgba(110,181,255,0.12)',
    color: 'var(--info)',
    dotBg: 'var(--info)',
  },
  completed: {
    bg: 'rgba(95,184,120,0.12)',
    color: 'var(--success)',
    dotBg: 'var(--success)',
  },
  cancelled: {
    bg: 'rgba(229,107,111,0.12)',
    color: 'var(--danger)',
    dotBg: 'var(--danger)',
  },
}

export function StatusBadge({ status, showDot = true, size = 'sm' }: StatusBadgeProps) {
  const style = statusStyles[status] ?? statusStyles.inactive
  const fontSize = size === 'sm' ? '11px' : '13px'
  const padding = size === 'sm' ? '3px 10px' : '5px 14px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding,
        borderRadius: '20px',
        fontSize,
        fontWeight: 500,
        background: style.bg,
        color: style.color,
      }}
    >
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: style.dotBg,
            flexShrink: 0,
            boxShadow: status === 'active' ? '0 0 6px rgba(95,184,120,0.6)' : 'none',
          }}
        />
      )}
      {getStatusLabel(status)}
    </span>
  )
}
