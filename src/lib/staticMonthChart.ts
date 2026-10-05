import { annualTemperatureDomain, annualWaveDomain, chartHeight, chartMargin, chartWidth, fractalRenderConfig } from './chartConfig'
import { createChartScales, createRibbonPath, createTemperatureColorScale } from './chartGeometry'
import { createSweepingContourPath } from './strands'
import type { DailyWaveSummary } from './types'

const escaped = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Shared static equivalent of the compact chart: same domains and contour generator, no DOM or events. */
export function renderStaticMonthSvg(days: DailyWaveSummary[], month: number, showYAxis: boolean) {
  const { x, y } = createChartScales(days, annualWaveDomain, chartHeight)
  const temperatureColor = createTemperatureColorScale(annualTemperatureDomain)
  const ribbon = createRibbonPath(days, x, y)
  const contours = Array.from({ length: fractalRenderConfig.contourCount }, (_, index) => createSweepingContourPath(days, index, fractalRenderConfig.contourCount, month, x, y, fractalRenderConfig.iterations, fractalRenderConfig.strength)).map((path) => `<path d="${escaped(path)}" />`).join('')
  const stops = days.map((day) => `<stop offset="${((x(day.day) - chartMargin.left) / (chartWidth - chartMargin.left - chartMargin.right)) * 100}%" stop-color="${day.waterTempMean === null ? '#7f8992' : temperatureColor(day.waterTempMean)}" />`).join('')
  const guides = [1, 2, 3, 4, 5].map((value) => `<line x1="${chartMargin.left}" x2="${chartWidth - chartMargin.right}" y1="${y(value)}" y2="${y(value)}" />`).join('')
  const xTicks = [1, Math.round(days.length / 2), days.length].map((value) => `<line x1="${x(value)}" x2="${x(value)}" y1="${chartHeight - chartMargin.bottom}" y2="${chartHeight - chartMargin.bottom + 6}" /><text x="${x(value)}" y="${chartHeight - chartMargin.bottom + 23}" text-anchor="middle">${value}</text>`).join('')
  const yAxis = showYAxis ? [1, 2, 3, 4, 5].map((value) => `<line x1="${chartMargin.left - 6}" x2="${chartMargin.left}" y1="${y(value)}" y2="${y(value)}" /><text x="${chartMargin.left - 11}" y="${y(value) + 3}" text-anchor="end">${value}</text>`).join('') : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${chartWidth} ${chartHeight}"><defs><linearGradient id="temperature" gradientUnits="userSpaceOnUse" x1="${chartMargin.left}" x2="${chartWidth - chartMargin.right}" y1="0" y2="0">${stops}</linearGradient><clipPath id="ribbon-clip"><path d="${escaped(ribbon)}" /></clipPath></defs><g class="guides">${guides}</g><path d="${escaped(ribbon)}" fill="url(#temperature)" fill-opacity="${fractalRenderConfig.fillOpacity}" /><g class="contours" clip-path="url(#ribbon-clip)">${contours}</g><g class="axis x-axis"><line x1="${chartMargin.left}" x2="${chartWidth - chartMargin.right}" y1="${chartHeight - chartMargin.bottom}" y2="${chartHeight - chartMargin.bottom}" />${xTicks}</g>${showYAxis ? `<g class="axis y-axis"><line x1="${chartMargin.left}" x2="${chartMargin.left}" y1="${chartMargin.top}" y2="${chartHeight - chartMargin.bottom}" />${yAxis}</g>` : ''}<style>.guides line{stroke:rgba(255,255,255,.1);stroke-width:1}.contours{fill:none;stroke:url(#temperature);stroke-linecap:round;stroke-linejoin:round;stroke-opacity:.19;stroke-width:.72}.axis{fill:#68727b;stroke:rgba(255,255,255,.1);font:10px Arial,sans-serif}.axis line{stroke:rgba(255,255,255,.1)}</style></svg>`
}
