import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { DateTime } from 'luxon'
import { parseNdbc, type RawObservation } from './parseNdbc.ts'

export interface DailyWaveSummary {
  date: string; year: number; month: number; day: number
  observationCount: number; validWaveObservationCount: number
  waveHeightMean: number | null; waveHeightP10: number | null; waveHeightP90: number | null
  waterTempMean: number | null; dominantPeriodMean: number | null; averagePeriodMean: number | null
  meanWaveDirection: number | null
}
const valid = (items: Array<number | null>) => items.filter((item): item is number => item !== null && Number.isFinite(item))
const mean = (items: number[]) => items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : null
const percentile = (items: number[], p: number) => {
  if (!items.length) return null
  const sorted = [...items].sort((a, b) => a - b); const position = (sorted.length - 1) * p
  const lower = Math.floor(position); const upper = Math.ceil(position)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}
const circularMean = (items: number[]) => {
  if (!items.length) return null
  const radians = items.map((d) => d * Math.PI / 180)
  const angle = Math.atan2(mean(radians.map(Math.sin))!, mean(radians.map(Math.cos))!) * 180 / Math.PI
  return (angle + 360) % 360
}

function makeSummary(date: DateTime, observations: RawObservation[]): DailyWaveSummary {
  const waves = valid(observations.map((o) => o.WVHT))
  return { date: date.toISODate()!, year: date.year, month: date.month, day: date.day,
    observationCount: observations.length, validWaveObservationCount: waves.length,
    waveHeightMean: mean(waves), waveHeightP10: percentile(waves, .1), waveHeightP90: percentile(waves, .9),
    waterTempMean: mean(valid(observations.map((o) => o.WTMP))), dominantPeriodMean: mean(valid(observations.map((o) => o.DPD))),
    averagePeriodMean: mean(valid(observations.map((o) => o.APD))), meanWaveDirection: circularMean(valid(observations.map((o) => o.MWD))) }
}

async function main() {
  const source = await readFile(resolve('data/raw/46026h2025.txt'), 'utf8')
  const observations = parseNdbc(source)
  const byDate = new Map<string, RawObservation[]>()
  observations.forEach((observation) => byDate.set(observation.localDate, [...(byDate.get(observation.localDate) ?? []), observation]))
  const start = DateTime.fromISO('2025-01-01', { zone: 'America/Los_Angeles' })
  const days = Array.from({ length: 365 }, (_, i) => makeSummary(start.plus({ days: i }), byDate.get(start.plus({ days: i }).toISODate()!) ?? []))
  for (let month = 1; month <= 12; month++) {
    const monthly = days.filter((day) => day.month === month); const counts = monthly.map((day) => day.validWaveObservationCount).filter(Boolean).sort((a, b) => a - b)
    const median = counts.length ? percentile(counts, .5)! : 0
    monthly.filter((day) => day.validWaveObservationCount < median * .5).forEach((day) => { day.waveHeightMean = null; day.waveHeightP10 = null; day.waveHeightP90 = null })
  }
  if (days.some((day) => [day.waveHeightMean, day.waveHeightP10, day.waveHeightP90].some((n) => n !== null && (!Number.isFinite(n) || n < 0)))) throw new Error('Validation failed: invalid wave height.')
  const output = { station: { id: '46026', name: 'San Francisco', timezone: 'America/Los_Angeles' }, year: 2025, units: { waveHeight: 'm', waterTemperature: 'C', wavePeriod: 's', waveDirection: 'degrees' }, days }
  await mkdir(resolve('public/data'), { recursive: true }); await writeFile(resolve('public/data/46026-2025-daily.json'), JSON.stringify(output, null, 2))
  console.log(`Processed ${observations.length} observations into ${days.length} local-day summaries.`)
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1 })
