import { useMetrics } from './data/useMetrics'
import { buildKPIs, buildFunnel, detectAlerts, buildTrendSeries, buildWinRateSeries, lastNDays } from './lib/analytics'
import { DatasetSelector } from './components/DatasetSelector'
import { AlertStrip } from './components/AlertStrip'
import { KPIGrid } from './components/KPIGrid'
import { FunnelChart } from './components/FunnelChart'
import { TrendChart } from './components/TrendChart'
import './styles.css'

export default function App() {
  const { dataset, activeDataset, setActiveDataset, loading, error } = useMetrics()

  if (loading) {
    return (
      <div className="state-screen">
        <div className="spinner" />
        <p>Cargando métricas…</p>
      </div>
    )
  }

  if (error || !dataset) {
    return (
      <div className="state-screen error">
        <p className="error-title">No se pudo cargar el dataset</p>
        <p className="error-detail">{error}</p>
      </div>
    )
  }

  const alerts = detectAlerts(dataset)
  const kpis = buildKPIs(dataset, 30)
  const funnel = buildFunnel(lastNDays(dataset, 30))
  const responseTrend = buildTrendSeries(dataset, 'avg_response_time_min', 60)
  const staleTrend = buildTrendSeries(dataset, 'stale_deals', 60)
  const winRateTrend = buildWinRateSeries(dataset, 14, 90)

  const lastDate = dataset.days[dataset.days.length - 1].date
  const formattedDate = new Date(lastDate).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Executive Brief</h1>
          <p className="app-date">{formattedDate}</p>
        </div>
        <DatasetSelector active={activeDataset} onChange={setActiveDataset} />
      </header>

      <main className="app-main">
        {/* Focus strip */}
        <section className="section">
          <h2 className="section-title">
            <span className="section-dot critical" />
            Dónde poner foco hoy
          </h2>
          <AlertStrip alerts={alerts} />
        </section>

        {/* KPIs */}
        <section className="section">
          <h2 className="section-title">KPIs principales</h2>
          <KPIGrid kpis={kpis} />
        </section>

        {/* Charts row */}
        <section className="section">
          <h2 className="section-title">Tendencias</h2>
          <div className="charts-grid">
            <FunnelChart steps={funnel} />
            <TrendChart
              title="Win rate (rolling 14 días)"
              subtitle="% deals ganados sobre cerrados"
              data={winRateTrend}
              color="#6366f1"
              unit="%"
              referenceValue={30}
              referenceLabel="30%"
            />
            <TrendChart
              title="Tiempo de respuesta"
              subtitle="promedio diario · minutos"
              data={responseTrend}
              color="#f59e0b"
              unit="min"
              referenceValue={30}
              referenceLabel="30min"
            />
            <TrendChart
              title="Stale deals"
              subtitle="deals abiertos +60 días"
              data={staleTrend}
              color="#ef4444"
              unit=""
            />
          </div>
        </section>
      </main>
    </div>
  )
}
