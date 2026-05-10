# Executive Brief — PALVI Dashboard

Reporte ejecutivo de métricas B2B SaaS. Pensado para el Jefe de Ventas que tiene 5 minutos antes de su primera reunión del día.

## Setup local

```bash
npm install
cp .env.example .env.local
# Edita .env.local con la URL del metrics.json (ver abajo)
npm run dev
```

### Dónde hospedar el JSON

El archivo `metrics.json` no está en el repo intencionalmente. Las opciones:

**GitHub Gist (recomendado para entrega):**
1. Ir a [gist.github.com](https://gist.github.com), crear un Gist **secreto** con el contenido de `metrics.json`
2. Clic en "Raw" → copiar URL
3. Pegarlo en `.env.local` como `VITE_METRICS_URL=<url>`

**Vercel (en producción):**
Agregar `VITE_METRICS_URL` como environment variable en el dashboard de Vercel, apuntando al mismo Gist raw URL.

---

## Decisiones técnicas

**JSON via URL, no en el repo.** El dataset es información sensible de negocio. Hospedar como Gist secreto y leerlo en runtime mantiene el repo limpio sin agregar complejidad de infraestructura (no hay API server, no hay cold starts).

**JSON como asset estático, no API.** El dataset es inmutable y pesa ~650KB. Servirlo como archivo plano es más simple, más rápido y sin puntos de falla adicionales. Una API añadiría latencia y un servicio extra que mantener sin ningún beneficio real para este caso.

**Recharts sobre D3.** D3 da control total pero requiere un orden de magnitud más de código para el mismo resultado visual. Recharts tiene las abstracciones correctas para dashboards declarativos en React. La API de composición (LineChart > Line > XAxis) es intuitiva y mantenible.

**Analytics separado de componentes.** Todo el cálculo vive en `src/lib/analytics.ts`: agregaciones, win rate, detección de alertas. Los componentes solo renderizan. Esto permite testear la lógica sin montar nada.

**La alert strip es el producto principal.** El enunciado dice "salir sabiendo dónde poner foco hoy". No es un dashboard exploratorio, es un briefing. Las alertas se generan automáticamente según el dataset activo y responden diferente para cada uno: D dispara por tiempo de respuesta (>40 min), A por stale deals (+49 en 30 días), B por win rate cayendo, C no tiene alertas críticas porque sus métricas son saludables.

**`direction` del metadata controla los colores.** No se hardcodea qué métricas son "buenas". Si el JSON dice `lower_is_better`, una flecha hacia abajo es verde. Esto hace la lógica agnóstica al dominio.

**Tipado estricto end-to-end.** El shape del JSON está tipado en `src/data/types.ts`. El hook `useMetrics` expone types, no `any`. Errores de integración aparecen en tiempo de compilación.

---

## Segunda iteración

**Período configurable.** Hoy los KPIs comparan siempre 30 días vs 30 días anteriores. Permitir que el usuario elija la ventana (7d / 30d / 90d) añade mucho valor con poco código, pero requería una decisión de UX que no quería dejar a medias.

**Win rate por cohorte.** El win rate actual es de período (qué cerró esta semana). El win rate de cohorte (qué pasó con los deals abiertos en marzo) es más preciso pero requiere datos que el dataset no incluye — lo dejé como nota en el glosario del PDF.

**Alertas configurables.** Los umbrales (30min de response time, 25% de win rate) están hardcodeados en `analytics.ts`. En producción deberían ser configurables por empresa.

**Tests de la lógica de analytics.** La función `detectAlerts` y las agregaciones son el corazón de la app y no tienen tests. Con Vitest sería directo, pero no entraba en el tiempo estimado.
