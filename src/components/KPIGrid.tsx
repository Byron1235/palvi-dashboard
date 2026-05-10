import type { KPISummary } from '../lib/analytics'

interface Props {
  kpis: KPISummary[]
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return '—'
  if (unit === 'visits' || unit === 'leads' || unit === 'deals' || unit === 'tickets') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value).toString()
  }
  if (unit === 'min') return `${value.toFixed(0)}m`
  if (unit === 'days') return `${value.toFixed(1)}d`
  if (unit === 'hours') return `${value.toFixed(1)}h`
  return value.toFixed(1)
}

function TrendArrow({ trend, isGood }: { trend: KPISummary['trend']; isGood: boolean | null }) {
  if (!trend || trend === 'flat') return <span className="trend-flat">—</span>
  const arrow = trend === 'up' ? '↑' : '↓'
  const cls = isGood === true ? 'trend-good' : isGood === false ? 'trend-bad' : 'trend-neutral'
  return <span className={`trend-arrow ${cls}`}>{arrow}</span>
}

// Which KPIs to show prominently in the grid
const FEATURED_KEYS = [
  'leads_created',
  'deals_won',
  'avg_response_time_min',
  'stale_deals',
  'support_tickets_opened',
  'avg_deal_cycle_days',
]

export function KPIGrid({ kpis }: Props) {
  const featured = kpis.filter((k) => FEATURED_KEYS.includes(k.key))

  return (
    <div className="kpi-grid">
      {featured.map((kpi) => (
        <div key={kpi.key} className="kpi-card">
          <div className="kpi-label">{kpi.label}</div>
          <div className="kpi-value-row">
            <span className="kpi-value">{formatValue(kpi.current, kpi.unit)}</span>
            <TrendArrow trend={kpi.trend} isGood={kpi.isGood} />
          </div>
          {kpi.changePct !== null && (
            <div className={`kpi-change ${kpi.isGood === true ? 'good' : kpi.isGood === false ? 'bad' : ''}`}>
              {kpi.changePct > 0 ? '+' : ''}{kpi.changePct.toFixed(1)}% vs mes anterior
            </div>
          )}
          <div className="kpi-unit">últimos 30 días · {kpi.unit}</div>
        </div>
      ))}
    </div>
  )
}
