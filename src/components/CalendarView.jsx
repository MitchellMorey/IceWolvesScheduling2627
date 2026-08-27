import { WEEKDAYS, OPEN_TEAM, ENTRY_KIND, TEAM_DURATION_MINUTES, durationMinutesFor } from '../constants'
import { buildMonthGrid, todayKey, formatTime12h, timeToMinutes } from '../dateUtils'

// Column 0/6 (Sun/Sat) are always wider. Columns 1-5 (Mon-Fri) start
// narrow and individually expand to match the weekend width if that
// weekday column has an event anywhere in the visible grid.
const WEEKEND_WIDTH = '1.25fr'
const WEEKDAY_NARROW = '0.8fr'
const WEEKDAY_EXPANDED = '1.15fr'

export default function CalendarView({ year, month, events, isEditor, onDayClick, onEventClick, onGroupClick, onRinkEventClick }) {
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
          // Home games listed first (earliest to latest), then away games
          // below them (also earliest to latest).
          const games = dayEntries
            .filter((ev) => ev.kind !== ENTRY_KIND.ALLOCATION)
            .sort((a, b) => {
              if (a.location !== b.location) return a.location === 'home' ? -1 : 1
              return (a.time || '').localeCompare(b.time || '')
            })

          // A game "fills" the allocation that owns its slot when they share
          // the same team and time - once that happens, the allocation
          // marker drops off the calendar since the game chip now covers it.
          const filledKeys = new Set(games.map((ev) => `${ev.team}|${ev.time || ''}`))
          let openAllocations = dayEntries.filter(
            (ev) => ev.kind === ENTRY_KIND.ALLOCATION && !filledKeys.has(`${ev.team}|${ev.time || ''}`)
          )

          // Rink events (tournament/on-ice) covering this day supersede the
          // individual ice-slot holds they overlap with, for every team - a
          // tournament takes over the whole rink for the dates it covers
          // (not just the tournament's own team's slots), and an on-ice
          // event takes over the rink for its specific time window.
          const tournamentsForDay = tournaments.filter(
            (t) => cell.dateKey >= t.date && cell.dateKey <= (t.end_date || t.date)
          )
          const onIceForDay = onIceEvents.filter((t) => t.date === cell.dateKey)

          openAllocations = openAllocations.filter((alloc) => {
            const coveredByTournament = tournamentsForDay.some((t) => {
              if (t.all_day) return true
              const endDate = t.end_date || t.date
              // A day strictly between the tournament's start/end dates is
              // fully covered regardless of the start/end times.
              if (cell.dateKey !== t.date && cell.dateKey !== endDate) return true
              if (!alloc.time) return true
              if (cell.dateKey === t.date && t.time && alloc.time < t.time) return false
              if (cell.dateKey === endDate && t.end_time && alloc.time >= t.end_time) return false
              return true
            })
            if (coveredByTournament) return false
            const coveredByOnIce = onIceForDay.some((t) => {
              if (t.all_day) return true
              if (!t.time || !t.end_time || !alloc.time) return true
              return alloc.time >= t.time && alloc.time < t.end_time
            })
            return !coveredByOnIce
          })

          // An "Open" allocation isn't held by anyone, so any home game
          // that overlaps its time window (using the team-based duration
          // it was set up with) simply overrides and hides it - unlike a
          // real team's slot, which blocks the save with a conflict error
          // instead (see App.jsx's findTimeConflict). Games narrower than
          // the open window only cover part of it, so only the open slots
          // that actually overlap the new game disappear - the other one
          // (if any) stays.
          openAllocations = openAllocations.filter((alloc) => {
            if (alloc.team !== OPEN_TEAM) return true
            const allocDuration = durationMinutesFor(alloc)
            const allocStart = timeToMinutes(alloc.time)
            if (!allocDuration || allocStart == null) return true
            const allocEnd = allocStart + allocDuration
            const overriddenByGame = games.some((g) => {
              if (g.location && g.location !== 'home') return false
              const gStart = timeToMinutes(g.time)
              if (gStart == null) return false
              const gDuration = TEAM_DURATION_MINUTES[g.team] || 0
              const gEnd = gStart + gDuration
              return gStart < allocEnd && allocStart < gEnd
            })
            return !overriddenByGame
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
                      data-team={ev.team || ''}
                      onClick={() => onRinkEventClick(ev)}
                      title={
                        ev.chipKind === ENTRY_KIND.TOURNAMENT
                          ? `${ev.team} Tournament${ev.date !== ev.end_date ? ` (${ev.date} to ${ev.end_date})` : ''}`
                          : ev.all_day
                          ? `${ev.opponent || 'On-Ice Event'}`
                          : `${ev.opponent || 'On-Ice Event'} ${formatTime12h(ev.time)}–${formatTime12h(ev.end_time)}`
                      }
                    >
                      {ev.chipKind === ENTRY_KIND.TOURNAMENT
                        ? `${ev.team} Tournament`
                        : ev.all_day
                        ? `${ev.opponent || 'On-Ice Event'}`
                        : `${ev.opponent || 'On-Ice Event'} ${formatTime12h(ev.time)}–${formatTime12h(ev.end_time)}`}
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
                      data-team={ev.team}
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
              {isEditor && (
                <button className="day-add" onClick={() => onDayClick(cell.dateKey)}>
                  + Add
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
