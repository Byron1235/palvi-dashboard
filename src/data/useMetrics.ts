import { useState, useEffect } from 'react'
import type { MetricsData, DatasetKey, Dataset } from './types'

interface UseMetricsReturn {
  data: MetricsData | null
  activeDataset: DatasetKey
  setActiveDataset: (key: DatasetKey) => void
  dataset: Dataset | null
  loading: boolean
  error: string | null
}

export function useMetrics(): UseMetricsReturn {
  const [data, setData] = useState<MetricsData | null>(null)
  const [activeDataset, setActiveDataset] = useState<DatasetKey>('A')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = import.meta.env.VITE_METRICS_URL

    if (!url) {
      setError('VITE_METRICS_URL is not defined. Add it to your .env.local file.')
      setLoading(false)
      return
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.status}`)
        return res.json()
      })
      .then((json: MetricsData) => {
        setData(json)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return {
    data,
    activeDataset,
    setActiveDataset,
    dataset: data ? data[activeDataset] : null,
    loading,
    error,
  }
}
