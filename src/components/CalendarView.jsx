import { WEEKDAYS, OPEN_TEAM, ENTRY_KIND } from '../constants'
import { buildMonthGrid, todayKey, formatTime12h } from '../dateUtils'

// Column 0/6 (Sun/Sat) are always wider. Columns 1-5 (Mon-Fri) start
// narrow and individually expand to match the weekend width if that
// weekday column has an event anywhere in the visible grid.
const WEEKEND_WIDTH = '1.25fr'
const WEEKDAY_NARROW = '0.8fr'
const WEEKDAY_EXPANDED = '1.15fr'

export default function CalendarView({ year, month, events, onDayClick, onEventClick, onGroupClick, onRinkEventClick }) {
  const cells = buildMonthGrid(year, month)
  const today = todayKey()

  // Tournaments/on-ice events aren't day-bucketed like everything else -
  // a tournament can span several days, so they're checked per-cell against
  // their own date range below instead of via eventsByDay.
  const tournaments = events.filter((ev) => ev.kind === ENTRY_KIND.TOURNAMENT)
  const onIceEvents = events.filter((ev) => ev.kind === ENTRY_KIND.ON_ICE_EVENT)

  const eventsByDay = events.reduce((acc, ev) => {
    if (ev.kind === ENTRY_KIND.TOURNAMENT || ev.kind === ENTRY_KIND.ON_ICE_EVENT) return acc
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
          const games = dayEntries.filter((ev) => ev.kind !== ENTRY_KIND.ALLOCATION)

          // A game "fills" the allocation that owns its slot when they share
          // the same team and time - once that happens, the allocation
          // marker drops off the calendar since the game chip now covers it.
          const filledKeys = new Set(games.map((ev) => `${ev.team}|${ev.time || ''}`))
          let openAllocations = dayEntries.filter(
            (ev) => ev.kind === ENTRY_KIND.ALLOCATION && !filledKeys.has(`${ev.team}|${ev.time || ''}`)
          )

          // Rink events (tournament/on-ice) covering this day supersede the
          // individual ice-slot holds they overlap with - a tournament hides
          // that team's holds for the whole date range it covers, and an
          // on-ice event hides any team's holds inside its time window.
          const tournamentsForDay = tournaments.filter(
            (t) => cell.dateKey >= t.date && cell.dateKey <= (t.end_date || t.date)
          )
          const onIceForDay = onIceEvents.filter((t) => t.date === cell.dateKey)

          openAllocations = openAllocations.filter((alloc) => {
            const coveredByTournament = tournamentsForDay.some((t) => t.team === alloc.team)
            if (coveredByTournament) return false
            const coveredByOnIce = onIceForDay.some((t) => {
              if (!t.time || !t.end_time || !alloc.time) return true
              return alloc.time >= t.time && alloc.time < t.end_time
            })
            return !coveredByOnIce
          })

          const rinkEventChips = [
            ...tournamentsForDay.map((ev) => ({ ...ev, chipKind: ENTRY_KIND.TOURNAMENT })),
            ...onIceForDay.map((ev) => ({ ...ev, chipKind: ENTRY_KIND.ON_ICE_EVENT })),
          ]

          // Group same-time allocations (e.g. Squirt + She Wolves sharing a
          // slot) into a single combined chip.
          const groupsByTime = []
          openAllocations.forEach((ev) => {
            const key = ev.time || ''
            let group = groupsByTime.find((g) => g.time === key)
            if (!group) {
              group = { time: key, allocations: [] }
              groupsByTime.push(group)
            }
            group.allocations.push(ev)
          })

          return (
            <div
              key={cell.dateKey}
              className="day-cell"
              data-muted={cell.muted}
              data-today={cell.dateKey === today}
              data-has-events={dayEntries.length > 0}
            >
              <span className="day-number">{cell.day}</span>

              {rinkEventChips.length > 0 && (
                <div className="day-rink-events">
                  {rinkEventChips.map((ev) => (
                    <button
                      key={ev.id}
                      className="rink-event-chip"
                      data-kind={ev.chipKind}
                      onClick={() => onRinkEventClick(ev)}
                      title={
                        ev.chipKind === ENTRY_KIND.TOURNAMENT
                          ? `${ev.team} Tournament${ev.date !== ev.end_date ? ` (${ev.date} to ${ev.end_date})` : ''}`
                          : `On-Ice Event ${formatTime12h(ev.time)}–${formatTime12h(ev.end_time)}`
                      }
                    >
                      {ev.chipKind === ENTRY_KIND.TOURNAMENT
                        ? `${ev.team} Tournament`
                        : `On-Ice ${formatTime12h(ev.time)}–${formatTime12h(ev.end_time)}`}
                    </button>
                  ))}
                </div>
              )}

              {groupsByTime.length > 0 && (
                <div className="day-allocations">
                  {groupsByTime.map((group) => {
                    const isSingle = group.allocations.length === 1
                    const label = group.allocations.map((a) => a.team).join(' / ')
                    const isOpen = group.allocations.some((a) => a.team === OPEN_TEAM)
                    return (
                      <button
                        key={group.time || 'no-time'}
                        className="allocation-chip"
                        data-open={isOpen}
                        onClick={() =>
                          isSingle ? onEventClick(group.allocations[0]) : onGroupClick(group.allocations)
                        }
                        title={
                          isSingle
                            ? `${label} slot${group.time ? ` @ ${formatTime12h(group.time)}` : ''} - click to fill in a game or reassign`
                            : `${label} share this slot${group.time ? ` @ ${formatTime12h(group.time)}` : ''} - click to fill in a game or reassign either team`
                        }
                      >
                        {group.time ? formatTime12h(group.time) : ''} {label}
                      </button>
                    )
                  })}
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
