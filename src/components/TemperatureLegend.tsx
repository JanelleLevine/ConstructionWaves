import { useId } from 'react'

export function TemperatureLegend() {
  const gradientId = useId().replace(/:/g, '')
  return <div className="shared-temperature-legend" aria-label="Sea surface temperature scale from 10.0 to 17.5 degrees Celsius"><span>SEA SURFACE TEMPERATURE</span><svg viewBox="0 0 260 31" role="img"><defs><linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stopColor="#3F6FFF" /><stop offset="50%" stopColor="#22D3C5" /><stop offset="100%" stopColor="#FFD166" /></linearGradient></defs><rect x="0" y="5" width="260" height="8" rx="4" fill={`url(#${gradientId})`} /><text x="0" y="29">10.0°C</text><text x="130" y="29" textAnchor="middle">13.8°C</text><text x="260" y="29" textAnchor="end">17.5°C</text></svg></div>
}
