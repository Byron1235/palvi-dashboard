import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { TrendPoint } from '../lib/analytics'

interface Props {
  title: string
  subtitle?: string
  data: TrendPoint[]
  color?: string
  unit?: string
  referenceValue?: number
  referenceLabel?: string
  invertColors?: boolean // for lower_is_better metrics
}

interface TooltipPayloadItem {
  value: number | null
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  unit?: string
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length || payload[0].value === null) return null
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-value">
        {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : '—'}
        {unit ? ` ${unit}` : ''}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

// Show only every Nth tick to avoid crowding
function tickFormatter(value: string, index: number, total: number): string {
  const step = Math.ceil(total / 6)
  if (index % step !== 0) return ''
  return formatDate(value)
}

export function TrendChart({
  title,
  subtitle,
  data,
  color = '#6366f1',
  unit,
  referenceValue,
  referenceLabel,
}: Props) {
  const total = data.length

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        {subtitle && <span className="chart-subtitle">{subtitle}</span>}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v, i) => tickFormatter(v, i, total)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => (unit === '%' ? `${v.toFixed(0)}%` : v.toFixed(0))}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {referenceValue !== undefined && (
            <ReferenceLine
              y={referenceValue}
              stroke="var(--color-warning)"
              strokeDasharray="4 4"
              label={{
                value: referenceLabel ?? '',
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'var(--color-warning)',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
