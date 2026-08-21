import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import CalendarView from './components/CalendarView'
import EventModal from './components/EventModal'
import RinkEventModal from './components/RinkEventModal'
import AvailableSlotsModal from './components/AvailableSlotsModal'
import LoginControl from './components/LoginControl'
import { useAuth } from './useAuth'
import { TEAMS, REAL_TEAMS, OPEN_TEAM, ENTRY_KIND } from './constants'
import { MONTH_NAMES, SEASON_MONTHS, clampToSeason, formatTime12h, toDateKey } from './dateUtils'
import iceWolvesLogo from './assets/ice-wolves-logo.jpg'
import sheWolvesLogo from './assets/she-wolves-logo.png'

const SEASON_START = SEASON_MONTHS[0]
const SEASON_END = SEASON_MONTHS[SEASON_MONTHS.length - 1]

// Season window used for the stats table: Nov 1, 2026 - Feb 28, 2027 (inclusive).
const SEASON_START_KEY = '2026-11-01'
const SEASON_END_KEY = '2027-02-28'

export default function App() {
  const { userEmail, isEditor, authLoading, sendMagicLink, signOut } = useAuth()
  const now = new Date()
  const initial = clampToSeason(now.getFullYear(), now.getMonth())
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTeams, setActiveTeams] = useState(new Set(TEAMS))
  const [modalState, setModalState] = useState(null) // { mode: 'add'|'edit', event?, defaultDate? }
  const [rinkModalState, setRinkModalState] = useState(null) // { mode: 'add'|'edit', event?, defaultDate? }
  const [slotsDropdownOpen, setSlotsDropdownOpen] = useState(false)
  const [slotsTeam, setSlotsTeam] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    setLoadError('')
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      setLoadError(error.message)
    } else {
      setEvents(data)
    }
    setLoading(false)
  }

  async function handleSave(form, existingId) {
    if (existingId) {
      const { data, error } = await supabase
        .from('events')
        .update(form)
        .eq('id', existingId)
        .select()
      if (error) throw error
      setEvents((prev) => prev.map((ev) => (ev.id === existingId ? data[0] : ev)))
    } else {
      // For a brand-new allocation, remember which team it started out
      // belonging to - this survives later reassignment (e.g. to "Open")
      // so the app can tell "this team's day off" apart from "this slot
      // was never held by anyone."
      const payload =
        form.kind === ENTRY_KIND.ALLOCATION ? { ...form, original_team: form.team } : form
      const { data, error } = await supabase.from('events').insert(payload).select()
      if (error) throw error
      setEvents((prev) => [...prev, data[0]])
    }
    setModalState(null)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) throw error
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
    setModalState(null)
  }

  // Row-level versions used inside the grouped-allocation modal, where
  // reassigning or deleting one row shouldn't close the whole modal - the
  // other team's slot in the group may still need attention.
  async function handleReassignRow(id, team) {
    const { data, error } = await supabase.from('events').update({ team }).eq('id', id).select()
    if (error) throw error
    setEvents((prev) => prev.map((ev) => (ev.id === id ? data[0] : ev)))
    return data[0]
  }

  async function handleDeleteRow(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) throw error
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
  }

  // Finds already-scheduled games that would fall inside a proposed
  // tournament/on-ice-event window, so the save can be blocked instead of
  // silently burying a real game under a rink event.
  function findConflicts(form, excludeId) {
    const endDate = form.end_date || form.date
    return events.filter((ev) => {
      if (ev.id === excludeId) return false
      if (ev.kind !== ENTRY_KIND.GAME) return false
      // Away games don't need home ice, so they never block a rink event -
      // only home games (which need this rink's ice) can conflict.
      if (ev.location !== 'home') return false
      if (ev.date < form.date || ev.date > endDate) return false

      if (form.kind === ENTRY_KIND.TOURNAMENT) {
        // A tournament takes over the whole rink for its dates, so any
        // team's home game in the window conflicts - not just the
        // tournament's own team.
        if (form.all_day) return true
        // A day strictly between the start/end dates is fully covered.
        if (ev.date !== form.date && ev.date !== endDate) return true
        if (ev.date === form.date && form.time && ev.time && ev.time < form.time) return false
        if (ev.date === endDate && form.end_time && ev.time && ev.time >= form.end_time) return false
        return true
      }

      // on_ice_event: rink-wide - any team's home game on this date/time
      // conflicts. All-day covers the whole date regardless of time.
      if (form.all_day) return true
      if (!ev.time) return true
      if (form.time && ev.time < form.time) return false
      if (form.end_time && ev.time >= form.end_time) return false
      return true
    })
  }

  async function handleSaveRinkEvent(form, existingId) {
    const conflicts = findConflicts(form, existingId)
    if (conflicts.length > 0) {
      const list = conflicts
        .map((c) => `${c.team} ${c.date}${c.time ? ` ${formatTime12h(c.time)}` : ''}`)
        .join(', ')
      throw new Error(
        `This overlaps with an already-scheduled game (${list}). Move or remove that game first.`
      )
    }

    if (existingId) {
      const { data, error } = await supabase.from('events').update(form).eq('id', existingId).select()
      if (error) throw error
      setEvents((prev) => prev.map((ev) => (ev.id === existingId ? data[0] : ev)))
    } else {
      const { data, error } = await supabase.from('events').insert(form).select()
      if (error) throw error
      setEvents((prev) => [...prev, data[0]])
    }
    setRinkModalState(null)
  }

  async function handleDeleteRinkEvent(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) throw error
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
    setRinkModalState(null)
  }

  const visibleEvents = useMemo(
    // On-ice events are rink-wide (no team), so team filters don't apply to
    // them - everything else is filtered by the active team set as before.
    () => events.filter((ev) => ev.kind === ENTRY_KIND.ON_ICE_EVENT || activeTeams.has(ev.team)),
    [events, activeTeams]
  )

  function toggleTeam(team) {
    setActiveTeams((prev) => {
      const next = new Set(prev)
      if (next.has(team)) next.delete(team)
      else next.add(team)
      return next
    })
  }

  // Every ice-slot allocation for a team that doesn't (yet) have a game
  // filled in - same "filled" and "superseded by a rink event" rules the
  // calendar itself uses, just run across the whole season instead of one
  // visible month at a time.
  function getOpenSlotsForTeam(team) {
    const teamAllocations = events.filter(
      (ev) => ev.kind === ENTRY_KIND.ALLOCATION && ev.team === team
    )
    const filledKeys = new Set(
      events
        .filter((ev) => ev.kind === ENTRY_KIND.GAME)
        .map((ev) => `${ev.date}|${ev.team}|${ev.time || ''}`)
    )
    // Squirt and She Wolves split two ice slots on the same date - once
    // either of them already has a home game that day (at either slot),
    // the OTHER slot shouldn't be offered as open too, since that would
    // mean hosting a second game the same day.
    const teamHomeGameDates = new Set(
      events
        .filter(
          (ev) => ev.kind === ENTRY_KIND.GAME && ev.team === team && ev.location === 'home'
        )
        .map((ev) => ev.date)
    )
    const tournaments = events.filter((ev) => ev.kind === ENTRY_KIND.TOURNAMENT)
    const onIceEvents = events.filter((ev) => ev.kind === ENTRY_KIND.ON_ICE_EVENT)

    return teamAllocations
      .filter((alloc) => !filledKeys.has(`${alloc.date}|${alloc.team}|${alloc.time || ''}`))
      .filter((alloc) => !teamHomeGameDates.has(alloc.date))
      .filter((alloc) => {
        const coveredByTournament = tournaments.some((t) => {
          const endDate = t.end_date || t.date
          if (alloc.date < t.date || alloc.date > endDate) return false
          if (t.all_day) return true
          if (alloc.date !== t.date && alloc.date !== endDate) return true
          if (!alloc.time) return true
          if (alloc.date === t.date && t.time && alloc.time < t.time) return false
          if (alloc.date === endDate && t.end_time && alloc.time >= t.end_time) return false
          return true
        })
        if (coveredByTournament) return false

        const coveredByOnIce = onIceEvents.some((t) => {
          if (t.date !== alloc.date) return false
          if (t.all_day) return true
          if (!t.time || !t.end_time || !alloc.time) return true
          return alloc.time >= t.time && alloc.time < t.end_time
        })
        return !coveredByOnIce
      })
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
  }

  // Every Saturday/Sunday in the season where a team has no game (any
  // event type) and isn't covered by one of its own tournaments - i.e.
  // weekend dates that team is free to travel for an away tournament.
  function getTravelDatesForTeam(team) {
    const weekendDates = []
    const cursor = new Date(2026, 10, 1) // Nov 1, 2026
    const end = new Date(2027, 1, 28) // Feb 28, 2027
    while (cursor <= end) {
      const day = cursor.getDay()
      if (day === 0 || day === 6) {
        weekendDates.push(toDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()))
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    const teamGameDates = new Set(
      events.filter((ev) => ev.kind === ENTRY_KIND.GAME && ev.team === team).map((ev) => ev.date)
    )
    const teamTournaments = events.filter(
      (ev) => ev.kind === ENTRY_KIND.TOURNAMENT && ev.team === team
    )

    // Dates where this team's own held slot was deliberately marked
    // "Open" (not just left unfilled) - treated as an intentional day
    // off, not a travel opportunity, even though no game is scheduled.
    const teamBlockedOpenDates = new Set(
      events
        .filter(
          (ev) =>
            ev.kind === ENTRY_KIND.ALLOCATION &&
            ev.team === OPEN_TEAM &&
            ev.original_team === team
        )
        .map((ev) => ev.date)
    )

    return weekendDates.filter((dateKey) => {
      if (teamGameDates.has(dateKey)) return false
      if (teamBlockedOpenDates.has(dateKey)) return false
      const coveredByTournament = teamTournaments.some(
        (t) => dateKey >= t.date && dateKey <= (t.end_date || t.date)
      )
      return !coveredByTournament
    })
  }

  const isAtSeasonStart = year === SEASON_START.year && month === SEASON_START.month
  const isAtSeasonEnd = year === SEASON_END.year && month === SEASON_END.month

  function changeMonth(delta) {
    let m = month + delta
    let y = year
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    const clamped = clampToSeason(y, m)
    setMonth(clamped.month)
    setYear(clamped.year)
  }

  function goToday() {
    const clamped = clampToSeason(now.getFullYear(), now.getMonth())
    setYear(clamped.year)
    setMonth(clamped.month)
  }

  // ---------- Season stats ----------
  // Allocations are just slot markers, and "Open" entries are unclaimed ice
  // holds - neither counts as a confirmed game. A rink-event Tournament
  // (kind === 'tournament', spanning a date range) isn't a single game, but
  // it occupies the rink like one - each one counts as three home games for
  // the team it's booked for. An individual filled-in game whose type is
  // "Tournament" (kind === 'game', event_type === 'Tournament') is a single
  // real game and counts like any other game.
  const TOURNAMENT_GAME_CREDIT = 3

  const monthKeyPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  const seasonGamesByTeam = useMemo(() => {
    const map = {}
    REAL_TEAMS.forEach((team) => { map[team] = [] })
    events
      .filter(
        (ev) =>
          ev.kind === ENTRY_KIND.GAME &&
          (ev.event_type === 'Game' || ev.event_type === 'Tournament') &&
          ev.team !== OPEN_TEAM &&
          ev.date >= SEASON_START_KEY &&
          ev.date <= SEASON_END_KEY
      )
      .forEach((ev) => {
        if (map[ev.team]) map[ev.team].push(ev)
      })
    return map
  }, [events])

  const seasonTournamentsByTeam = useMemo(() => {
    const map = {}
    REAL_TEAMS.forEach((team) => { map[team] = [] })
    events
      .filter(
        (ev) =>
          ev.kind === ENTRY_KIND.TOURNAMENT &&
          ev.date >= SEASON_START_KEY &&
          ev.date <= SEASON_END_KEY
      )
      .forEach((ev) => {
        if (map[ev.team]) map[ev.team].push(ev)
      })
    return map
  }, [events])

  const teamStats = useMemo(() => {
    const count = (list, loc) => list.filter((ev) => ev.location === loc).length
    return REAL_TEAMS.map((team) => {
      const games = seasonGamesByTeam[team] || []
      const tournaments = seasonTournamentsByTeam[team] || []
      const monthGames = games.filter((ev) => ev.date.startsWith(monthKeyPrefix))
      const monthTournaments = tournaments.filter((ev) => ev.date.startsWith(monthKeyPrefix))

      const homeGamesSeason = count(games, 'home') + tournaments.length * TOURNAMENT_GAME_CREDIT
      const awayGamesSeason = count(games, 'away')
      const homeGamesMonth = count(monthGames, 'home') + monthTournaments.length * TOURNAMENT_GAME_CREDIT
      const awayGamesMonth = count(monthGames, 'away')

      return {
        team,
        totalGamesSeason: homeGamesSeason + awayGamesSeason,
        homeGamesMonth,
        awayGamesMonth,
        homeGamesSeason,
        awayGamesSeason,
      }
    })
  }, [seasonGamesByTeam, seasonTournamentsByTeam, monthKeyPrefix])

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img className="brand-logo" src={iceWolvesLogo} alt="Ice Wolves logo" />
          <div>
            <h1>Ice Wolves Game Schedules, 2026-2027</h1>
            <p>Games, All Teams</p>
          </div>
          <img className="brand-logo" src={sheWolvesLogo} alt="She Wolves logo" />
        </div>
        <div className="header-actions">
          <LoginControl
            userEmail={userEmail}
            isEditor={isEditor}
            authLoading={authLoading}
            sendMagicLink={sendMagicLink}
            signOut={signOut}
          />
          {userEmail && (
            <div className="slots-btn-wrap">
              <button
                type="button"
                className="slots-btn"
                onClick={() => setSlotsDropdownOpen((open) => !open)}
              >
                Game Availability ▾
              </button>
              {slotsDropdownOpen && (
                <>
                  <div className="slots-dropdown-backdrop" onClick={() => setSlotsDropdownOpen(false)} />
                  <div className="slots-dropdown">
                    {REAL_TEAMS.map((team) => (
                      <button
                        key={team}
                        type="button"
                        className="slots-dropdown-item"
                        onClick={() => {
                          setSlotsTeam(team)
                          setSlotsDropdownOpen(false)
                        }}
                      >
                        {team}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {isEditor && (
            <button className="add-btn" onClick={() => setRinkModalState({ mode: 'add' })}>
              + Add Rink Event
            </button>
          )}
        </div>
      </header>

      <div className="controls">
        <div className="month-nav">
          <button aria-label="Previous month" onClick={() => changeMonth(-1)} disabled={isAtSeasonStart}>‹</button>
          <span className="scoreboard">{MONTH_NAMES[month]} {year}</span>
          <button aria-label="Next month" onClick={() => changeMonth(1)} disabled={isAtSeasonEnd}>›</button>
          <button className="today-btn" onClick={goToday}>Today</button>
        </div>
        <div className="team-filters">
          {TEAMS.map((team) => (
            <button
              key={team}
              className="team-chip"
              data-active={activeTeams.has(team)}
              data-open={team === OPEN_TEAM}
              onClick={() => toggleTeam(team)}
            >
              {team}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="loading-state">Loading schedule…</div>}

      {!loading && loadError && (
        <div className="empty-state">
          Couldn't load the schedule ({loadError}). Check your Supabase setup in .env.
        </div>
      )}

      {!loading && !loadError && (
        <CalendarView
          year={year}
          month={month}
          events={visibleEvents}
          isEditor={isEditor}
          onDayClick={(dateKey) => setModalState({ mode: 'add', kind: ENTRY_KIND.GAME, defaultDate: dateKey })}
          onEventClick={(ev) => setModalState({ mode: 'edit', kind: ev.kind || ENTRY_KIND.GAME, event: ev })}
          onGroupClick={(group) => setModalState({ mode: 'group', group })}
          onRinkEventClick={(ev) => setRinkModalState({ mode: 'edit', event: ev })}
        />
      )}

      <div className="legend">
        <span><i className="home" /> Home (solid)</span>
        <span><i className="away" /> Away (dashed)</span>
        {REAL_TEAMS.map((team) => (
          <span key={team}><i className={`team-swatch team-swatch-${team.replace(/\s+/g, '').toLowerCase()}`} /> {team}</span>
        ))}
      </div>

      <table className="stats-table">
        <caption>Season Stats — {MONTH_NAMES[month]} {year}</caption>
        <thead>
          <tr>
            <th>Team</th>
            <th>Total Games This Season</th>
            <th>Home Games This Month</th>
            <th>Away Games This Month</th>
            <th>Total Home Games This Season</th>
            <th>Total Away Games This Season</th>
          </tr>
        </thead>
        <tbody>
          {teamStats.map((row) => (
            <tr key={row.team}>
              <td>{row.team}</td>
              <td>{row.totalGamesSeason}</td>
              <td>{row.homeGamesMonth}</td>
              <td>{row.awayGamesMonth}</td>
              <td>{row.homeGamesSeason}</td>
              <td>{row.awayGamesSeason}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalState && (
        <EventModal
          key={JSON.stringify(modalState)}
          initialEvent={modalState.event}
          group={modalState.group}
          defaultDate={modalState.defaultDate}
          kind={modalState.kind}
          prefillTeam={modalState.prefillTeam}
          prefillTime={modalState.prefillTime}
          readOnly={!isEditor}
          onClose={() => setModalState(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          onReassignRow={handleReassignRow}
          onDeleteRow={handleDeleteRow}
          onFillGame={({ team, date, time }) =>
            setModalState({
              mode: 'add',
              kind: ENTRY_KIND.GAME,
              defaultDate: date,
              prefillTeam: team,
              prefillTime: time,
            })
          }
        />
      )}

      {rinkModalState && (
        <RinkEventModal
          key={JSON.stringify(rinkModalState)}
          initialEvent={rinkModalState.event}
          defaultDate={rinkModalState.defaultDate}
          readOnly={!isEditor}
          onClose={() => setRinkModalState(null)}
          onSave={handleSaveRinkEvent}
          onDelete={handleDeleteRinkEvent}
        />
      )}

      {slotsTeam && (
        <AvailableSlotsModal
          team={slotsTeam}
          slots={getOpenSlotsForTeam(slotsTeam)}
          travelDates={getTravelDatesForTeam(slotsTeam)}
          onClose={() => setSlotsTeam(null)}
        />
      )}
    </div>
  )
}
