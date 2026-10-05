import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { renderStaticMonthSvg } from '../src/lib/staticMonthChart.ts'
import type { DailyWaveSummary } from '../src/lib/types.ts'

const names = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
async function main() {
  const dataset = JSON.parse(await readFile(resolve('public/data/cdip-142-2025-daily.json'), 'utf8')) as { days: DailyWaveSummary[] }
  const output = resolve('public/generated/months')
  await mkdir(output, { recursive: true })
  await Promise.all(names.map(async (name, index) => {
    const month = index + 1
    const svg = renderStaticMonthSvg(dataset.days.filter((day) => day.month === month), month, index % 3 === 0)
    await sharp(Buffer.from(svg)).resize(2400, 1000).webp({ quality: 88 }).toFile(resolve(output, `${name}.webp`))
  }))
  console.log(`Generated ${names.length} static monthly WebP charts in ${output}`)
}
main().catch((error: unknown) => { console.error(error); process.exitCode = 1 })
