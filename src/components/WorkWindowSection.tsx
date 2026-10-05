import { monthName } from './MonthSelector'
import { TemperatureLegend } from './TemperatureLegend'

const names = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

export function WorkWindowSection() {
  return <section className="work-window" aria-labelledby="work-window-title"><div className="work-window-copy"><h2 id="work-window-title">Choose Your Work Window</h2><p>Imagine you are planning a two-month marine construction project near the Golden Gate. You want to choose a time when waves are usually lower and less variable. Which two-month window would you choose?</p><p>Compare all 12 months below. Look at both the height of the waves and how much they change from day to day.</p><p className="work-window-note">Real projects also consider tides, currents, weather, equipment limits, and other site conditions.</p></div><div className="small-multiple-grid">{names.map((name, index) => <article className="small-multiple" key={name}><h3>{monthName(index + 1)}</h3><img src={`/generated/months/${name}.webp`} alt={`${monthName(index + 1)} wave conditions at the San Francisco Bar`} width="1200" height="500" loading="lazy" decoding="async" /></article>)}</div><TemperatureLegend /></section>
}
