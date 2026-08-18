// All dates are handled as local-date strings 'YYYY-MM-DD' to avoid timezone drift.

export function toDateKey(year, month, day) {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function todayKey() {
  const d = new Date()
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

export function buildMonthGrid(year, month) {
  // month is 0-indexed
  const firstOfMonth = new Date(year, month, 1)
  const startDay = firstOfMonth.getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []

  // leading days from previous month
  for (let i = startDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    cells.push({ day, muted: true, dateKey: toDateKey(y, m, day) })
  }

  // current month days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, muted: false, dateKey: toDateKey(year, month, day) })
  }

  // trailing days to complete the last week
  const remainder = cells.length % 7
  if (remainder !== 0) {
    const trailing = 7 - remainder
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    for (let day = 1; day <= trailing; day++) {
      cells.push({ day, muted: true, dateKey: toDateKey(y, m, day) })
    }
  }

  return cells
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function formatTime12h(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')}${period}`
}
