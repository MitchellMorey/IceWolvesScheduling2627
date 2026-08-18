import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import CalendarView from './components/CalendarView'
import EventModal from './components/EventModal'
import { TEAMS } from './constants'
import { MONTH_NAMES, SEASON_MONTHS, clampToSeason } from './dateUtils'
import iceWolvesLogo from './assets/ice-wolves-logo.jpg'
import sheWolvesLogo from './assets/she-wolves-logo.png'

const SEASON_START = SEASON_MONTHS[0]
const SEASON_END = SEASON_MONTHS[SEASON_MONTHS.length - 1]

// Season window used for the stats table: Nov 1, 2026 - Feb 28, 2027 (inclusive).
const SEASON_START_KEY = '2026-11-01'
const SEASON_END_KEY = '2027-02-28'

export default function App() {
  const now = new Date()
  const initial = clampToSeason(now.getFullYear(), now.getMonth())
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTeams, setActiveTeams] = useState(new Set(TEAMS))
  const [modalState, setModalState] = useState(null) // { mode: 'add'|'edit', event?, defaultDate? }

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
      const { data, error } = await supabase.from('events').insert(form).select()
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

  const visibleEvents = useMemo(
    () => events.filter((ev) => activeTeams.has(ev.team)),
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
  const seasonGames = useMemo(
    () =>
      events.filter(
        (ev) =>
          ev.event_type === 'Game' && ev.date >= SEASON_START_KEY && ev.date <= SEASON_END_KEY
      ),
    [events]
  )

  const monthKeyPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthGames = useMemo(
    () => seasonGames.filter((ev) => ev.date.startsWith(monthKeyPrefix)),
    [seasonGames, monthKeyPrefix]
  )

  const stats = useMemo(() => {
    const count = (list, loc) => list.filter((ev) => ev.location === loc).length
    return {
      totalGamesSeason: seasonGames.length,
      homeGamesMonth: count(monthGames, 'home'),
      awayGamesMonth: count(monthGames, 'away'),
      homeGamesSeason: count(seasonGames, 'home'),
      awayGamesSeason: count(seasonGames, 'away'),
    }
  }, [seasonGames, monthGames])

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
        <button className="add-btn" onClick={() => setModalState({ mode: 'add' })}>
          + Add Schedule Entry
        </button>
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
          onDayClick={(dateKey) => setModalState({ mode: 'add', defaultDate: dateKey })}
          onEventClick={(ev) => setModalState({ mode: 'edit', event: ev })}
        />
      )}

      <div className="legend">
        <span><i className="home" /> Home</span>
        <span><i className="away" /> Away</span>
      </div>

      <table className="stats-table">
        <caption>Season Stats — {MONTH_NAMES[month]} {year}</caption>
        <thead>
          <tr>
            <th>Total Games This Season</th>
            <th>Home Games This Month</th>
            <th>Away Games This Month</th>
            <th>Total Home Games This Season</th>
            <th>Total Away Games This Season</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{stats.totalGamesSeason}</td>
            <td>{stats.homeGamesMonth}</td>
            <td>{stats.awayGamesMonth}</td>
            <td>{stats.homeGamesSeason}</td>
            <td>{stats.awayGamesSeason}</td>
          </tr>
        </tbody>
      </table>

      {modalState && (
        <EventModal
          initialEvent={modalState.event}
          defaultDate={modalState.defaultDate}
          onClose={() => setModalState(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
