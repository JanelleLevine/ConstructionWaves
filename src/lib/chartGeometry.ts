import { area, curveLinear, scaleLinear } from 'd3'
import { chartMargin, chartWidth } from './chartConfig'
import { temperaturePalette } from './chartConfig'
import type { DailyWaveSummary } from './types'

export function createChartScales(days: DailyWaveSummary[], waveDomain: [number, number], chartHeight: number) {
  return {
    x: scaleLinear().domain([1, Math.max(days.length, 1)]).range([chartMargin.left, chartWidth - chartMargin.right]),
    y: scaleLinear().domain(waveDomain).nice().range([chartHeight - chartMargin.bottom, chartMargin.top]),
  }
}

export function createRibbonPath(days: DailyWaveSummary[], x: (day: number) => number, y: (waveHeight: number) => number) {
  return area<DailyWaveSummary>().defined((day) => day.waveHeightP10 !== null && day.waveHeightP90 !== null).x((day) => x(day.day)).y0((day) => y(day.waveHeightP10!)).y1((day) => y(day.waveHeightP90!)).curve(curveLinear)(days) ?? ''
}

export function createTemperatureColorScale(domain: [number, number]) {
  return scaleLinear<string>().domain([domain[0], (domain[0] + domain[1]) / 2, domain[1]]).range(temperaturePalette).clamp(true)
}
