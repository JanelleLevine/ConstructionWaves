import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const base = 'https://erddap.cdip.ucsd.edu/erddap/tabledap/'
const queries = {
  wave: 'wave_agg.csv?station_id,time,waveFlagPrimary,waveHs,waveTp,waveTa,waveDp&station_id=%22142%22&time>=2025-01-01T00:00:00Z&time<2026-01-01T00:00:00Z',
  sst: 'sst_agg.csv?station_id,time,sstFlagPrimary,sstSeaSurfaceTemperature&station_id=%22142%22&time>=2025-01-01T00:00:00Z&time<2026-01-01T00:00:00Z',
}

async function download(name: keyof typeof queries) {
  const response = await fetch(`${base}${queries[name]}`)
  if (!response.ok) throw new Error(`CDIP ${name} download failed: ${response.status} ${response.statusText}`)
  const text = await response.text()
  if (!text.includes('time')) throw new Error(`CDIP ${name} response did not contain a CSV header.`)
  const output = resolve(`data/raw/cdip-142-${name}-2025.csv`)
  await writeFile(output, text, 'utf8')
  console.log(`Saved ${text.length.toLocaleString()} characters to ${output}`)
}

async function main() { await mkdir(resolve('data/raw'), { recursive: true }); await download('wave'); await download('sst') }
main().catch((error: unknown) => { console.error(error); process.exitCode = 1 })
