import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { FunnelStep } from '../lib/analytics'

interface Props {
  steps: FunnelStep[]
}

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

interface TooltipPayloadItem {
  value: number
  name: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-value">{payload[0].value.toLocaleString()}</div>
    </div>
  )
}

export function FunnelChart({ steps }: Props) {
  const data = steps.map((s) => ({ name: s.label, value: s.value, conv: s.conversionFromPrev }))

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Embudo de ventas</h3>
        <span className="chart-subtitle">últimos 30 días</span>
      </div>
      <div className="funnel-conversions">
        {steps.slice(1).map((step, i) => (
          <div key={step.label} className="conv-badge">
            <span className="conv-from">{steps[i].label}</span>
            <span className="conv-arrow">→</span>
            <span className="conv-to">{step.label}</span>
            <span className="conv-rate">
              {step.conversionFromPrev !== null ? `${step.conversionFromPrev.toFixed(1)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
            width={45}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
