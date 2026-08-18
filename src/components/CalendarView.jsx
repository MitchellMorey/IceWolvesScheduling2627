import { WEEKDAYS, OPEN_TEAM, ENTRY_KIND } from '../constants'
import { buildMonthGrid, todayKey, formatTime12h } from '../dateUtils'

// Column 0/6 (Sun/Sat) are always wider. Columns 1-5 (Mon-Fri) start
// narrow and individually expand to match the weekend width if that
// weekday column has an event anywhere in the visible grid.
const WEEKEND_WIDTH = '1.25fr'
const WEEKDAY_NARROW = '0.8fr'
const WEEKDAY_EXPANDED = '1.15fr'

export default function CalendarView({ year, month, events, onDayClick, onEventClick }) {
  const cells = buildMonthGrid(year, month)
  const today = todayKey()

  const eventsByDay = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = []
    acc[ev.date].push(ev)
    return acc
  }, {})

  const hasEventsForCell = (cell) => (eventsByDay[cell.dateKey] || []).length > 0

  // Determine which weekday columns (Mon-Fri = index 1-5) contain an event.
  const weekdayHasEvent = [false, false, false, false, false, false, false]
  cells.forEach((cell, i) => {
    const col = i % 7
    if (col >= 1 && col <= 5 && hasEventsForCell(cell)) {
      weekdayHasEvent[col] = true
    }
  })

  const gridTemplateColumns = Array.from({ length: 7 }, (_, col) => {
    if (col === 0 || col === 6) return WEEKEND_WIDTH
    return weekdayHasEvent[col] ? WEEKDAY_EXPANDED : WEEKDAY_NARROW
  }).join(' ')

  return (
    <>
      <div className="weekday-row" style={{ gridTemplateColumns }}>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid" style={{ gridTemplateColumns }}>
        {cells.map((cell, i) => {
          if (cell.blank) {
            return <div key={cell.dateKey} className="day-cell day-cell-blank" aria-hidden="true" />
          }
          const dayEntries = (eventsByDay[cell.dateKey] || []).sort((a, b) =>
            (a.time || '').localeCompare(b.time || '')
          )
          const allocations = dayEntries.filter((ev) => ev.kind === ENTRY_KIND.ALLOCATION)
          const games = dayEntries.filter((ev) => ev.kind !== ENTRY_KIND.ALLOCATION)

          return (
            <div
              key={cell.dateKey}
              className="day-cell"
              data-muted={cell.muted}
              data-today={cell.dateKey === today}
              data-has-events={dayEntries.length > 0}
            >
              <span className="day-number">{cell.day}</span>

              {allocations.length > 0 && (
                <div className="day-allocations">
                  {allocations.map((ev) => (
                    <button
                      key={ev.id}
                      className="allocation-chip"
                      data-open={ev.team === OPEN_TEAM}
                      onClick={() => onEventClick(ev)}
                      title={`${ev.team} slot${ev.time ? ` @ ${formatTime12h(ev.time)}` : ''} - click to fill in a game or reassign`}
                    >
                      {ev.time ? formatTime12h(ev.time) : ''} {ev.team}
                    </button>
                  ))}
                </div>
              )}

              <div className="day-events">
                {games.map((ev) => {
                  const isOpen = ev.team === OPEN_TEAM
                  return (
                    <button
                      key={ev.id}
                      className="event-chip"
                      data-loc={ev.location}
                      data-open={isOpen}
                      onClick={() => onEventClick(ev)}
                      title={isOpen ? 'Open ice - not yet assigned' : `${ev.team} · ${ev.event_type}`}
                    >
                      <strong>{ev.time ? formatTime12h(ev.time) : ''} {ev.team}</strong>
                      {isOpen ? 'Open · tap to assign' : `${ev.event_type}${ev.opponent ? ` vs ${ev.opponent}` : ''}`}
                    </button>
                  )
                })}
              </div>
              <button className="day-add" onClick={() => onDayClick(cell.dateKey)}>
                + Add
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
