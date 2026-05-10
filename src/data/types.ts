export type Direction = 'higher_is_better' | 'lower_is_better'

export interface MetricMeta {
  key: string
  label: string
  unit: string
  direction: Direction
  description: string
}

export interface DayMetrics {
  traffic: number
  leads_created: number
  leads_qualified: number
  deals_created: number
  deals_won: number
  deals_lost: number
  avg_response_time_min: number | null
  avg_deal_cycle_days: number | null
  stale_deals: number
  support_tickets_opened: number
  support_avg_resolution_hours: number | null
}

export interface DayEntry {
  date: string
  metrics: DayMetrics
}

export interface DatasetMetadata {
  start_date: string
  end_date: string
  days: number
  metrics: MetricMeta[]
}

export interface Dataset {
  metadata: DatasetMetadata
  days: DayEntry[]
}

export type DatasetKey = 'A' | 'B' | 'C' | 'D'

export type MetricsData = Record<DatasetKey, Dataset>
