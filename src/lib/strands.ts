import { curveCatmullRom, line } from 'd3'
import type { DailyWaveSummary } from './types'

interface Point { x: number; y: number }

const seedFrom = (input: string) => {
  let hash = 2166136261
  for (let index = 0; index < input.length; index++) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619) }
  return hash >>> 0
}

const random = (seed: number) => () => {
  let value = seed += 0x6D2B79F5
  value = Math.imul(value ^ value >>> 15, value | 1)
  value ^= value + Math.imul(value ^ value >>> 7, value | 61)
  return ((value ^ value >>> 14) >>> 0) / 4294967296
}

/**
 * A normalized adaptation of setLinePoints(): recursively insert midpoints,
 * vary them in proportion to their segment width, then normalize the result.
 */
function createProfile(iterations: number, strength: number, seed: string) {
  const rng = random(seedFrom(seed))
  let values = [.5, .5]
  for (let iteration = 0; iteration < iterations; iteration++) {
    const next = [values[0]]
    const segmentWidth = 1 / (values.length - 1)
    for (let index = 0; index < values.length - 1; index++) {
      const midpoint = (values[index] + values[index + 1]) / 2
      next.push(midpoint + (rng() * 2 - 1) * strength * segmentWidth)
      next.push(values[index + 1])
    }
    values = next
  }
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  return maximum === minimum ? values.map(() => .5) : values.map((value) => (value - minimum) / (maximum - minimum))
}

const interpolateProfiles = (start: number[], end: number[], amount: number) => start.map((value, index) => value + (end[index] - value) * amount)

function contiguousGroups(days: DailyWaveSummary[]) {
  const groups: DailyWaveSummary[][] = []
  let current: DailyWaveSummary[] = []
  const flush = () => { if (current.length > 1) groups.push(current); current = [] }
  for (const day of days) {
    if (day.waveHeightP10 === null || day.waveHeightP90 === null) { flush(); continue }
    current.push(day)
  }
  flush()
  return groups
}

function envelopeAt(group: DailyWaveSummary[], day: number, y: (waveHeight: number) => number) {
  const first = group[0]
  const last = group[group.length - 1]
  if (day <= first.day) return { lower: y(first.waveHeightP10!), upper: y(first.waveHeightP90!) }
  if (day >= last.day) return { lower: y(last.waveHeightP10!), upper: y(last.waveHeightP90!) }
  const left = group[Math.floor(day) - first.day]
  const right = group[Math.floor(day) - first.day + 1]
  const fraction = day - left.day
  return {
    lower: y(left.waveHeightP10!) + fraction * (y(right.waveHeightP10!) - y(left.waveHeightP10!)),
    upper: y(left.waveHeightP90!) + fraction * (y(right.waveHeightP90!) - y(left.waveHeightP90!)),
  }
}

/** Multiple whole-profile morph states form nested sweeping contours. */
export function createSweepingContourPath(days: DailyWaveSummary[], contourIndex: number, contourCount: number, month: number, x: (day: number) => number, y: (waveHeight: number) => number, iterations: number, strength: number) {
  // More independent whole-profile targets prevent the field from collapsing
  // into only a few broad interpolation corridors.
  const keyframeCount = 8
  const profiles = Array.from({ length: keyframeCount }, (_, index) => createProfile(iterations, strength, `46026-2025-${month}-profile-${index}`))
  const position = contourCount === 1 ? 0 : contourIndex / (contourCount - 1) * (keyframeCount - 1)
  const startIndex = Math.min(keyframeCount - 2, Math.floor(position))
  const localAmount = position - startIndex
  // The eased whole-profile interpolation produces contours that gather and fan out.
  const easedAmount = .5 - .5 * Math.cos(Math.PI * localAmount)
  const profile = interpolateProfiles(profiles[startIndex], profiles[startIndex + 1], easedAmount)
  const path = line<Point>().x((point) => point.x).y((point) => point.y).curve(curveCatmullRom.alpha(.5))

  return contiguousGroups(days).map((group) => {
    const startDay = group[0].day
    const endDay = group[group.length - 1].day
    const points = profile.map((value, index) => {
      const fraction = index / (profile.length - 1)
      const day = startDay + fraction * (endDay - startDay)
      const envelope = envelopeAt(group, day, y)
      return { x: x(day), y: envelope.lower + value * (envelope.upper - envelope.lower) }
    })
    return path(points) ?? ''
  }).join(' ')
}
