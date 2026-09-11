import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const url = 'https://www.ndbc.noaa.gov/view_text_file.php?filename=46026h2025.txt.gz&dir=data/historical/stdmet/'
const output = resolve('data/raw/46026h2025.txt')

async function main() {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`NDBC download failed: ${response.status} ${response.statusText}`)
  const text = await response.text()
  if (!text.includes('WVHT')) throw new Error('NDBC download did not contain a standard meteorological header.')
  await mkdir(resolve('data/raw'), { recursive: true })
  await writeFile(output, text, 'utf8')
  console.log(`Saved ${text.length.toLocaleString()} characters to ${output}`)
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1 })
