import { area, axisBottom, axisLeft, curveLinear, interpolateYlGnBu, scaleLinear, scaleSequential, select } from 'd3'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createSweepingContourPath } from '../lib/strands'
import type { DailyWaveSummary } from '../lib/types'
import { Tooltip } from './Tooltip'

const width = 1200, height = 500, margin = { top: 35, right: 34, bottom: 62, left: 76 }
const missingTemperatureColor = '#b6c0bd'

export function DebugWaveChart({ days, yDomain, temperatureDomain, contourCount, iterations, strength, fillOpacity, month }: { days: DailyWaveSummary[]; yDomain: [number, number]; temperatureDomain: [number, number]; contourCount: number; iterations: number; strength: number; fillOpacity: number; month: number }) {
  const [hovered, setHovered] = useState<DailyWaveSummary | null>(null)
  const xAxis = useRef<SVGGElement>(null)
  const yAxis = useRef<SVGGElement>(null)
  const idBase = useId().replace(/:/g, '')
  const gradientId = `${idBase}-temperature`
  const clipId = `${idBase}-ribbon-clip`
  const x = useMemo(() => scaleLinear().domain([1, Math.max(days.length, 1)]).range([margin.left, width - margin.right]), [days.length])
  const y = useMemo(() => scaleLinear().domain(yDomain).nice().range([height - margin.bottom, margin.top]), [yDomain])
  const temperatureColor = useMemo(() => scaleSequential(interpolateYlGnBu).domain([temperatureDomain[1], temperatureDomain[0]]), [temperatureDomain])

  useEffect(() => {
    if (xAxis.current) select(xAxis.current).call(axisBottom(x).ticks(Math.min(days.length, 16)).tickFormat((d) => String(d)))
    if (yAxis.current) select(yAxis.current).call(axisLeft(y).ticks(6))
  }, [x, y, days.length])

  const defined = (day: DailyWaveSummary) => day.waveHeightP10 !== null && day.waveHeightP90 !== null
  const ribbon = area<DailyWaveSummary>().defined(defined).x((day) => x(day.day)).y0((day) => y(day.waveHeightP10!)).y1((day) => y(day.waveHeightP90!)).curve(curveLinear)(days)
  const contourPaths = useMemo(() => Array.from({ length: contourCount }, (_, index) => createSweepingContourPath(days, index, contourCount, month, x, y, iterations, strength)), [contourCount, days, iterations, month, strength, x, y])
  const dayWidth = (width - margin.left - margin.right) / Math.max(days.length, 1)
  const legendTicks = [temperatureDomain[0], (temperatureDomain[0] + temperatureDomain[1]) / 2, temperatureDomain[1]]

  return <div className="chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Continuous daily p10 to p90 significant wave height ribbon colored by sea-surface temperature"><defs><linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={margin.left} x2={width - margin.right} y1="0" y2="0">{days.map((day) => <stop key={day.date} offset={`${((x(day.day) - margin.left) / (width - margin.left - margin.right)) * 100}%`} stopColor={day.waterTempMean === null ? missingTemperatureColor : temperatureColor(day.waterTempMean)} />)}</linearGradient><linearGradient id={`${gradientId}-legend`} x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor={temperatureColor(temperatureDomain[0])} /><stop offset="50%" stopColor={temperatureColor((temperatureDomain[0] + temperatureDomain[1]) / 2)} /><stop offset="100%" stopColor={temperatureColor(temperatureDomain[1])} /></linearGradient><clipPath id={clipId}><path d={ribbon ?? undefined} /></clipPath></defs><text className="axis-label" x={margin.left} y="18">Significant wave height (m)</text><path className="temperature-ribbon" d={ribbon ?? undefined} fill={`url(#${gradientId})`} fillOpacity={fillOpacity} /><g className="strand-layer" clipPath={`url(#${clipId})`}>{contourPaths.map((path, index) => <path key={index} d={path} stroke={`url(#${gradientId})`} />)}</g><g className="temperature-legend" transform={`translate(${width - 255}, 10)`}><rect width="205" height="9" rx="4.5" fill={`url(#${gradientId}-legend)`} />{legendTicks.map((tick, index) => <text key={tick} x={index * 102.5} y="25" textAnchor={index === 0 ? 'start' : index === legendTicks.length - 1 ? 'end' : 'middle'}>{tick.toFixed(1)}°C</text>)}</g><g ref={xAxis} className="axis" transform={`translate(0, ${height - margin.bottom})`} /><g ref={yAxis} className="axis" transform={`translate(${margin.left}, 0)`} />{days.map((day) => <rect key={day.date} className="hit-area" x={x(day.day) - dayWidth / 2} y={margin.top} width={dayWidth} height={height - margin.top - margin.bottom} onMouseEnter={() => setHovered(day)} onFocus={() => setHovered(day)} onMouseLeave={() => setHovered(null)} tabIndex={0}><title>{day.date}</title></rect>)}</svg>{hovered && <Tooltip day={hovered} />}</div>
}
