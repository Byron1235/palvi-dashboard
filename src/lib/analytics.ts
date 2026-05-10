import type { Dataset, DayEntry, DayMetrics } from '../data/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

export function avg(values: (number | null)[]): number | null {
  const clean = values.filter((v): v is number => v !== null)
  if (!clean.length) return null
  return clean.reduce((a, b) => a + b, 0) / clean.length
}

export function sum(values: (number | null)[]): number {
  return values.filter((v): v is number => v !== null).reduce((a, b) => a + b, 0)
}

function pct(a: number, b: number): number | null {
  return b === 0 ? null : (a / b) * 100
}

// ── Period slices ─────────────────────────────────────────────────────────────

export function lastNDays(dataset: Dataset, n: number): DayEntry[] {
  return dataset.days.slice(-n)
}

export function prevNDays(dataset: Dataset, n: number): DayEntry[] {
  return dataset.days.slice(-(n * 2), -n)
}

// ── Win rate ─────────────────────────────────────────────────────────────────

export function winRate(days: DayEntry[]): number | null {
  const won = sum(days.map((d) => d.metrics.deals_won))
  const lost = sum(days.map((d) => d.metrics.deals_lost))
  return pct(won, won + lost)
}

// ── Funnel ───────────────────────────────────────────────────────────────────

export interface FunnelStep {
  label: string
  value: number
  conversionFromPrev: number | null
}

export function buildFunnel(days: DayEntry[]): FunnelStep[] {
  const traffic = sum(days.map((d) => d.metrics.traffic))
  const leads = sum(days.map((d) => d.metrics.leads_created))
  const qualified = sum(days.map((d) => d.metrics.leads_qualified))
  const deals = sum(days.map((d) => d.metrics.deals_created))
  const won = sum(days.map((d) => d.metrics.deals_won))

  const steps = [
    { label: 'Tráfico', value: traffic },
    { label: 'Leads', value: leads },
    { label: 'Calificados', value: qualified },
    { label: 'Deals', value: deals },
    { label: 'Ganados', value: won },
  ]

  return steps.map((step, i) => ({
    ...step,
    conversionFromPrev: i === 0 ? null : pct(step.value, steps[i - 1].value),
  }))
}

// ── KPI summary ───────────────────────────────────────────────────────────────

export interface KPISummary {
  key: keyof DayMetrics
  label: string
  unit: string
  direction: 'higher_is_better' | 'lower_is_better'
  current: number | null
  previous: number | null
  changePct: number | null
  trend: 'up' | 'down' | 'flat' | null
  isGood: boolean | null
}

export function buildKPIs(dataset: Dataset, windowDays = 30): KPISummary[] {
  const curr = lastNDays(dataset, windowDays)
  const prev = prevNDays(dataset, windowDays)
  const { metrics: metaDefs } = dataset.metadata

  return metaDefs.map((meta) => {
    const key = meta.key as keyof DayMetrics

    let currentVal: number | null
    let previousVal: number | null

    if (key === 'stale_deals') {
      // Point-in-time metric — use last day value
      currentVal = curr[curr.length - 1]?.metrics[key] ?? null
      previousVal = prev[prev.length - 1]?.metrics[key] ?? null
    } else if (
      key === 'avg_response_time_min' ||
      key === 'avg_deal_cycle_days' ||
      key === 'support_avg_resolution_hours'
    ) {
      currentVal = avg(curr.map((d) => d.metrics[key] as number | null))
      previousVal = avg(prev.map((d) => d.metrics[key] as number | null))
    } else {
      currentVal = sum(curr.map((d) => d.metrics[key] as number | null))
      previousVal = sum(prev.map((d) => d.metrics[key] as number | null))
    }

    const changePct =
      currentVal !== null && previousVal !== null && previousVal !== 0
        ? ((currentVal - previousVal) / previousVal) * 100
        : null

    let trend: KPISummary['trend'] = null
    if (changePct !== null) {
      if (Math.abs(changePct) < 1) trend = 'flat'
      else trend = changePct > 0 ? 'up' : 'down'
    }

    let isGood: boolean | null = null
    if (trend && trend !== 'flat') {
      isGood =
        meta.direction === 'higher_is_better' ? trend === 'up' : trend === 'down'
    }

    return {
      key,
      label: meta.label,
      unit: meta.unit,
      direction: meta.direction,
      current: currentVal,
      previous: previousVal,
      changePct,
      trend,
      isGood,
    }
  })
}

// ── Alert detection ───────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'positive'

export interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  detail: string
}

export function detectAlerts(dataset: Dataset): Alert[] {
  const alerts: Alert[] = []
  const last30 = lastNDays(dataset, 30)
  const prev30 = prevNDays(dataset, 30)
  const last7 = lastNDays(dataset, 7)
  const prev7 = prevNDays(dataset, 7)

  // 1. Win rate
  const wr30 = winRate(last30)
  const wrPrev30 = winRate(prev30)
  if (wr30 !== null) {
    if (wr30 < 25) {
      alerts.push({
        id: 'win-rate-critical',
        severity: 'critical',
        title: `Win rate crítico: ${wr30.toFixed(1)}%`,
        detail: 'Menos de 1 de cada 4 deals se está cerrando. Revisar proceso de cierre.',
      })
    } else if (wrPrev30 !== null && wr30 - wrPrev30 < -5) {
      alerts.push({
        id: 'win-rate-drop',
        severity: 'warning',
        title: `Win rate cayó ${Math.abs(wr30 - wrPrev30).toFixed(1)}pp vs mes anterior`,
        detail: `De ${wrPrev30.toFixed(1)}% a ${wr30.toFixed(1)}%. Tendencia negativa en cierre.`,
      })
    } else if (wrPrev30 !== null && wr30 - wrPrev30 > 8) {
      alerts.push({
        id: 'win-rate-up',
        severity: 'positive',
        title: `Win rate subió ${(wr30 - wrPrev30).toFixed(1)}pp este mes`,
        detail: `De ${wrPrev30.toFixed(1)}% a ${wr30.toFixed(1)}%. El equipo está cerrando mejor.`,
      })
    }
  }

  // 2. Stale deals trend
  const staleNow = dataset.days[dataset.days.length - 1].metrics.stale_deals
  const stale30ago = last30[0].metrics.stale_deals
  const staleDelta = staleNow - stale30ago
  if (staleDelta > 30) {
    alerts.push({
      id: 'stale-growing',
      severity: 'critical',
      title: `Stale deals creció +${staleDelta} en 30 días`,
      detail: `Hay ${staleNow} deals sin cerrar hace más de 60 días. Pipeline estancado.`,
    })
  } else if (staleDelta > 10) {
    alerts.push({
      id: 'stale-warning',
      severity: 'warning',
      title: `Stale deals en aumento: ${staleNow} activos`,
      detail: `Subió +${staleDelta} en el último mes. Considerar revisión de pipeline.`,
    })
  } else if (staleDelta < -5) {
    alerts.push({
      id: 'stale-down',
      severity: 'positive',
      title: `Stale deals bajando: ${staleNow} activos`,
      detail: `Se redujeron ${Math.abs(staleDelta)} en el último mes. Pipeline más limpio.`,
    })
  }

  // 3. Response time
  const rt7 = avg(last7.map((d) => d.metrics.avg_response_time_min))
  const rtPrev7 = avg(prev7.map((d) => d.metrics.avg_response_time_min))
  if (rt7 !== null) {
    if (rt7 > 60) {
      alerts.push({
        id: 'response-time-critical',
        severity: 'critical',
        title: `Tiempo de respuesta promedio: ${rt7.toFixed(0)}min`,
        detail: 'Supera 1 hora. En B2B, respuestas lentas reducen conversión significativamente.',
      })
    } else if (rt7 > 45) {
      alerts.push({
        id: 'response-time-high',
        severity: 'warning',
        title: `Tiempo de respuesta elevado: ${rt7.toFixed(0)}min esta semana`,
        detail: 'El estándar saludable en B2B es bajo 30 minutos.',
      })
    } else if (rtPrev7 !== null && rt7 - rtPrev7 > 10) {
      alerts.push({
        id: 'response-time-up',
        severity: 'warning',
        title: `Tiempo de respuesta subió ${(rt7 - rtPrev7).toFixed(0)}min vs semana anterior`,
        detail: `De ${rtPrev7.toFixed(0)} a ${rt7.toFixed(0)} minutos. Revisar disponibilidad del equipo.`,
      })
    }
  }

  // 4. Traffic trend
  const traffic30 = sum(last30.map((d) => d.metrics.traffic))
  const trafficPrev30 = sum(prev30.map((d) => d.metrics.traffic))
  const trafficChg = trafficPrev30 > 0 ? ((traffic30 - trafficPrev30) / trafficPrev30) * 100 : null
  if (trafficChg !== null && trafficChg < -10) {
    alerts.push({
      id: 'traffic-drop',
      severity: 'warning',
      title: `Tráfico cayó ${Math.abs(trafficChg).toFixed(0)}% vs mes anterior`,
      detail: 'Menor tráfico impacta el pipeline en 30-60 días. Revisar generación de demanda.',
    })
  }

  // 5. Support overload
  const suppTickets7 = avg(last7.map((d) => d.metrics.support_tickets_opened))
  const suppTicketsPrev7 = avg(prev7.map((d) => d.metrics.support_tickets_opened))
  if (suppTickets7 !== null && suppTicketsPrev7 !== null) {
    const chg = ((suppTickets7 - suppTicketsPrev7) / suppTicketsPrev7) * 100
    if (chg > 30) {
      alerts.push({
        id: 'support-surge',
        severity: 'warning',
        title: `Tickets de soporte subieron ${chg.toFixed(0)}% esta semana`,
        detail: `Promedio de ${suppTickets7.toFixed(0)} tickets/día vs ${suppTicketsPrev7.toFixed(0)} la semana pasada.`,
      })
    }
  }

  // Sort: critical first, then warning, then positive
  const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, positive: 2 }
  return alerts.sort((a, b) => order[a.severity] - order[b.severity])
}

// ── Trend series for charts ───────────────────────────────────────────────────

export interface TrendPoint {
  date: string
  value: number | null
}

export function buildTrendSeries(
  dataset: Dataset,
  key: keyof DayMetrics,
  days = 60
): TrendPoint[] {
  return lastNDays(dataset, days).map((d) => ({
    date: d.date,
    value: d.metrics[key] as number | null,
  }))
}

export function buildWinRateSeries(dataset: Dataset, windowDays = 14, days = 90): TrendPoint[] {
  const slice = lastNDays(dataset, days + windowDays)
  return slice.slice(windowDays).map((_, i) => {
    const window = slice.slice(i, i + windowDays)
    return {
      date: slice[i + windowDays].date,
      value: winRate(window),
    }
  })
}
