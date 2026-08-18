import { WEEKDAYS } from '../constants'
import { buildMonthGrid, todayKey, formatTime12h } from '../dateUtils'

export default function CalendarView({ year, month, events, onDayClick, onEventClick }) {
  const cells = buildMonthGrid(year, month)
  const today = todayKey()

  const eventsByDay = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = []
    acc[ev.date].push(ev)
    return acc
  }, {})

  return (
    <>
      <div className="weekday-row">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const dayEvents = (eventsByDay[cell.dateKey] || []).sort((a, b) =>
            (a.time || '').localeCompare(b.time || '')
          )
          return (
            <div
              key={cell.dateKey}
              className="day-cell"
              data-muted={cell.muted}
              data-today={cell.dateKey === today}
              data-has-events={dayEvents.length > 0}
            >
              <span className="day-number">{cell.day}</span>
              <div className="day-events">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    className="event-chip"
                    data-loc={ev.location}
                    onClick={() => onEventClick(ev)}
                    title={`${ev.team} · ${ev.event_type}`}
                  >
                    <strong>{ev.time ? formatTime12h(ev.time) : ''} {ev.team}</strong>
                    {ev.event_type}{ev.opponent ? ` vs ${ev.opponent}` : ''}
                  </button>
                ))}
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
