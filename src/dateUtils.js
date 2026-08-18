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

// ---------- Season configuration (2026-2027) ----------
// The schedule is scoped to November through February. Two exceptions are
// tacked on to the edge months so the club's early/late-season ice isn't
// left off the calendar: Sat 10/31 shows on the November view, and the
// first weekend of March (Sat 3/6 + Sun 3/7) shows on the February view.
// These are hardcoded to this specific season - update them if the app is
// reused for a different Nov-Feb season.
export const SEASON_MONTHS = [
  { year: 2026, month: 10 }, // November 2026
  { year: 2026, month: 11 }, // December 2026
  { year: 2027, month: 0 },  // January 2027
  { year: 2027, month: 1 },  // February 2027
]

export function isSeasonMonth(year, month) {
  return SEASON_MONTHS.some((m) => m.year === year && m.month === month)
}

export function clampToSeason(year, month) {
  const idx = SEASON_MONTHS.findIndex((m) => m.year === year && m.month === month)
  if (idx !== -1) return { year, month }
  // before season start -> clamp to first season month; after -> last
  const beforeStart =
    year < SEASON_MONTHS[0].year ||
    (year === SEASON_MONTHS[0].year && month < SEASON_MONTHS[0].month)
  return beforeStart
    ? { ...SEASON_MONTHS[0] }
    : { ...SEASON_MONTHS[SEASON_MONTHS.length - 1] }
}

function blankCell(key) {
  return { blank: true, dateKey: key }
}

export function buildMonthGrid(year, month) {
  // month is 0-indexed. Leading/trailing padding uses blank filler cells
  // (rather than real adjacent-month dates) since the calendar is scoped
  // to Nov-Feb, with two explicit extra-day exceptions below.
  const firstOfMonth = new Date(year, month, 1)
  const startDay = firstOfMonth.getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  let blankCounter = 0
  const pushBlank = () => cells.push(blankCell(`blank-${year}-${month}-${blankCounter++}`))

  const isNovember2026 = year === 2026 && month === 10
  const isFebruary2027 = year === 2027 && month === 1

  if (isNovember2026) {
    // Extra leading row: Sat 10/31 attached ahead of the November grid.
    for (let i = 0; i < 6; i++) pushBlank()
    cells.push({ day: 31, muted: true, extra: true, dateKey: '2026-10-31' })
  }

  // leading blanks to align the 1st of the month to its weekday column
  for (let i = 0; i < startDay; i++) pushBlank()

  // current month days
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, muted: false, dateKey: toDateKey(year, month, day) })
  }

  if (isFebruary2027) {
    // Extra trailing days: first weekend of March attached after February.
    // Feb 2027 ends on a Sunday, so the next row starts with Feb 28 alone;
    // fill Mon-Fri with blanks, then Sat 3/6, then a final row for Sun 3/7.
    for (let i = 0; i < 5; i++) pushBlank()
    cells.push({ day: 6, muted: true, extra: true, dateKey: '2027-03-06' })
    cells.push({ day: 7, muted: true, extra: true, dateKey: '2027-03-07' })
    for (let i = 0; i < 6; i++) pushBlank()
  } else {
    // trailing blanks to complete the last week
    const remainder = cells.length % 7
    if (remainder !== 0) {
      const trailing = 7 - remainder
      for (let i = 0; i < trailing; i++) pushBlank()
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

// 'YYYY-MM-DD' -> e.g. "Sat, Nov 7" - parsed as local date parts (not via
// `new Date(dateKey)`) to avoid UTC/local timezone drift shifting the day.
export function formatDateLabel(dateKey) {
  if (!dateKey) return ''
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
