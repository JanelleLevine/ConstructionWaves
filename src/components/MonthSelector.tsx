const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export function MonthSelector({ month, onChange }: { month: number; onChange: (month: number) => void }) {
  return <label className="month-selector">Month <select value={month} onChange={(event) => onChange(Number(event.target.value))}>{months.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select></label>
}
export const monthName = (month: number) => months[month - 1]
