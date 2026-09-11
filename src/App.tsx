import { useEffect, useMemo, useState } from 'react'
import { DebugWaveChart } from './components/DebugWaveChart'
import { MonthSelector, monthName } from './components/MonthSelector'
import { StrandControls } from './components/StrandControls'
import type { WaveDataset } from './lib/types'

export default function App() {
  const [dataset, setDataset] = useState<WaveDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState(1)
  const [iterations, setIterations] = useState(8)
  const [contourCount, setContourCount] = useState(280)
  const [strength, setStrength] = useState(.60)
  const [fillOpacity, setFillOpacity] = useState(0)

  useEffect(() => {
    fetch('/data/46026-2025-daily.json').then((response) => { if (!response.ok) throw new Error('Processed data file was not found. Run npm run data.'); return response.json() }).then(setDataset).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load data.'))
  }, [])

  const monthDays = useMemo(() => dataset?.days.filter((day) => day.month === month) ?? [], [dataset, month])
  const yDomain: [number, number] = [0.5, 5.0]
  const temperatureDomain = useMemo<[number, number]>(() => {
    const values = dataset?.days.map((day) => day.waterTempMean).filter((value): value is number => value !== null) ?? []
    return values.length ? [Math.min(...values), Math.max(...values)] : [0, 1]
  }, [dataset])

  if (error) return <main className="status"><h1>Data unavailable</h1><p>{error}</p></main>
  if (!dataset) return <main className="status"><p>Loading buoy observations…</p></main>

  return <main><header><p className="eyebrow">NOAA National Data Buoy Center · Station 46026</p><div className="header-row"><div><h1>A Month at Sea</h1><p className="subtitle">Significant wave height and sea-surface temperature<br />San Francisco buoy 46026 · {monthName(month)} 2025</p></div><MonthSelector month={month} onChange={setMonth} /></div></header><section aria-label={`${monthName(month)} 2025 wave chart`}><DebugWaveChart days={monthDays} yDomain={yDomain} temperatureDomain={temperatureDomain} contourCount={contourCount} iterations={iterations} strength={strength} fillOpacity={fillOpacity} month={month} /></section><StrandControls iterations={iterations} contourCount={contourCount} strength={strength} fillOpacity={fillOpacity} onIterationsChange={setIterations} onContourCountChange={setContourCount} onStrengthChange={setStrength} onFillOpacityChange={setFillOpacity} /><footer>Ribbon boundaries show the 10th–90th percentile of significant wave-height observations. Values are grouped by San Francisco local calendar date.</footer></main>
}
