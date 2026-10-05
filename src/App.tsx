import { useEffect, useMemo, useState } from 'react'
import { DebugWaveChart } from './components/DebugWaveChart'
import { MonthSelector, monthName } from './components/MonthSelector'
import { WorkWindowSection } from './components/WorkWindowSection'
import { annualTemperatureDomain, annualWaveDomain, fractalRenderConfig } from './lib/chartConfig'
import type { WaveDataset } from './lib/types'

export default function App() {
  const [dataset, setDataset] = useState<WaveDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState(1)

  useEffect(() => {
    fetch('data/cdip-142-2025-daily.json').then((response) => { if (!response.ok) throw new Error('Processed CDIP data file was not found. Run npm run data:cdip.'); return response.json() }).then(setDataset).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load data.'))
  }, [])

  const monthDays = useMemo(() => dataset?.days.filter((day) => day.month === month) ?? [], [dataset, month])
  const yDomain = annualWaveDomain
  const temperatureDomain = annualTemperatureDomain

  if (error) return <main className="status"><h1>Data unavailable</h1><p>{error}</p></main>
  if (!dataset) return <main className="status"><p>Loading buoy observations…</p></main>

  return <main><header><p className="eyebrow">Museum of Ocean Science</p><div className="header-row"><div><h1>Waves at Work</h1><p className="subtitle">Planning marine construction with ocean data</p></div></div></header><MonthSelector month={month} onChange={setMonth} /><section aria-label={`${monthName(month)} 2025 wave chart`}><DebugWaveChart days={monthDays} yDomain={yDomain} temperatureDomain={temperatureDomain} {...fractalRenderConfig} month={month} /></section><section className="exhibit-text" aria-label="About this visualization"><p>This visualization shows one year of ocean conditions at CDIP Station 142 near the San Francisco Bar, just outside the Golden Gate. Each month shows how wave height changed from day to day. The colors show changes in sea surface temperature.</p><p>These changes matter for marine construction. Bigger waves can make boats, barges, cranes, divers, and underwater robots harder to use safely. Wave period and direction also matter because waves of the same height can still behave very differently.</p><p>Buoy data helps turn the ocean into something we can measure and plan for. Looking at a full year can show when the ocean is usually calmer and when work may be more difficult. This data does not tell engineers exactly what to do, but it gives them a clearer picture of the conditions they may face. When it is used with tides, currents, forecasts, and other site information, it can help teams choose better work windows, plan safer jobs, and make better decisions.</p></section><footer>Data from CDIP Station 142, San Francisco Bar. Coastal Data Information Program, Scripps Institution of Oceanography.</footer><WorkWindowSection /></main>
}
