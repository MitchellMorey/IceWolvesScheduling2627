import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import CalendarView from './components/CalendarView'
import EventModal from './components/EventModal'
import { TEAMS } from './constants'
import { MONTH_NAMES } from './dateUtils'

export default function App() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
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

  function changeMonth(delta) {
    let m = month + delta
    let y = year
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setMonth(m)
    setYear(y)
  }

  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <h1>Rink Schedule</h1>
            <p>Games &amp; Practices, All Teams</p>
          </div>
        </div>
        <button className="add-btn" onClick={() => setModalState({ mode: 'add' })}>
          + Add Schedule Entry
        </button>
      </header>

      <div className="controls">
        <div className="month-nav">
          <button aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
          <span className="scoreboard">{MONTH_NAMES[month]} {year}</span>
          <button aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
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
