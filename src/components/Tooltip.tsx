import type { DailyWaveSummary } from '../lib/types'

const display = (value: number | null, digits: number, unit: string, missing = 'No valid data') => value === null ? missing : `${value.toFixed(digits)} ${unit}`

export function Tooltip({ day }: { day: DailyWaveSummary }) {
  return <div className="tooltip"><strong>{new Date(`${day.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong><span>Mean: {display(day.waveHeightMean, 2, 'm')}</span><span>P10: {display(day.waveHeightP10, 2, 'm')}</span><span>P90: {display(day.waveHeightP90, 2, 'm')}</span><span>Water: {display(day.waterTempMean, 1, '°C', 'No temperature data')}</span>{day.dominantPeriodMean !== null && <span>Dominant period: {display(day.dominantPeriodMean, 1, 's')}</span>}<span>Valid wave observations: {day.validWaveObservationCount}</span></div>
}
