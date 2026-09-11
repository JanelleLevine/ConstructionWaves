import { DateTime } from 'luxon'

export interface RawObservation {
  timestampUtc: string
  timestampLocal: string
  localDate: string
  WVHT: number | null
  WTMP: number | null
  DPD: number | null
  APD: number | null
  MWD: number | null
}

const fields = ['WVHT', 'WTMP', 'DPD', 'APD', 'MWD'] as const
/** NDBC uses both MM and field-specific numeric sentinel values for missing data. */
const value = (input: string | undefined, field: typeof fields[number]): number | null => {
  if (!input || input === 'MM') return null
  const parsed = Number(input)
  if ((field === 'WVHT' || field === 'WTMP' || field === 'DPD' || field === 'APD') && parsed >= 99) return null
  if (field === 'MWD' && parsed === 999) return null
  return Number.isFinite(parsed) ? parsed : null
}

/** Parses the header dynamically so NOAA column order can vary without changing the mapping. */
export function parseNdbc(text: string): RawObservation[] {
  const lines = text.split(/\r?\n/)
  const headerIndex = lines.findIndex((line) => /^#?YY\s+MM\s+DD\s+hh\s+mm\b/i.test(line.trim()))
  if (headerIndex < 0) throw new Error('Could not find an NDBC timestamp header.')
  const originalColumns = lines[headerIndex].trim().replace(/^#/, '').split(/\s+/)
  const columns = originalColumns.map((x) => x.toUpperCase())
  const index = Object.fromEntries(columns.map((column, i) => [column, i]))
  const yearIndex = columns.indexOf('YY'), monthIndex = originalColumns.findIndex((column) => column === 'MM')
  const dayIndex = columns.indexOf('DD'), hourIndex = columns.indexOf('HH'), minuteIndex = originalColumns.findIndex((column) => column === 'mm')
  if ([yearIndex, monthIndex, dayIndex, hourIndex].some((i) => i < 0)) throw new Error('NDBC header is missing timestamp columns.')

  return lines.slice(headerIndex + 1).flatMap((line) => {
    const row = line.trim().split(/\s+/)
    if (!line.trim() || row.length < columns.length || !/^\d{4}$/.test(row[yearIndex])) return []
    const month = Number(row[monthIndex]); const day = Number(row[dayIndex]); const hour = Number(row[hourIndex])
    const minute = minuteIndex < 0 ? 0 : Number(row[minuteIndex])
    const utc = DateTime.utc(Number(row[yearIndex]), month, day, hour, Number.isFinite(minute) ? minute : 0)
    if (!utc.isValid) return []
    const local = utc.setZone('America/Los_Angeles')
    const observation: RawObservation = {
      timestampUtc: utc.toISO()!, timestampLocal: local.toISO()!, localDate: local.toISODate()!,
      WVHT: value(row[index.WVHT], 'WVHT'), WTMP: value(row[index.WTMP], 'WTMP'), DPD: value(row[index.DPD], 'DPD'),
      APD: value(row[index.APD], 'APD'), MWD: value(row[index.MWD], 'MWD'),
    }
    return [observation]
  })
}
