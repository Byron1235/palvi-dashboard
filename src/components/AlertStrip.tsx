import type { Alert } from '../lib/analytics'

interface Props {
  alerts: Alert[]
}

const ICONS: Record<string, string> = {
  critical: '⚠',
  warning: '●',
  positive: '↑',
}

export function AlertStrip({ alerts }: Props) {
  if (!alerts.length) {
    return (
      <div className="alert-strip empty">
        <span className="alert-empty-icon">✓</span>
        <span>Sin alertas activas — todo dentro de parámetros normales.</span>
      </div>
    )
  }

  return (
    <div className="alert-strip">
      {alerts.map((alert) => (
        <div key={alert.id} className={`alert-card alert-${alert.severity}`}>
          <div className="alert-header">
            <span className="alert-icon">{ICONS[alert.severity]}</span>
            <span className="alert-title">{alert.title}</span>
          </div>
          <p className="alert-detail">{alert.detail}</p>
        </div>
      ))}
    </div>
  )
}
