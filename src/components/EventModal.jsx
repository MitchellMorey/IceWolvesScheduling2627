import { useState } from 'react'
import { TEAMS, EVENT_TYPES, ENTRY_KIND } from '../constants'

const emptyForm = (dateKey, kind, prefillTeam, prefillTime) => ({
  team: prefillTeam || TEAMS[0],
  date: dateKey || '',
  time: prefillTime || '',
  event_type: kind === ENTRY_KIND.ALLOCATION ? 'Practice' : 'Game',
  location: 'home',
  opponent: '',
  notes: '',
  kind,
})

export default function EventModal({
  initialEvent,
  defaultDate,
  kind = ENTRY_KIND.GAME,
  prefillTeam,
  prefillTime,
  onClose,
  onSave,
  onDelete,
  onFillGame,
}) {
  const [form, setForm] = useState(
    initialEvent
      ? {
          team: initialEvent.team,
          date: initialEvent.date,
          time: initialEvent.time || '',
          event_type: initialEvent.event_type,
          location: initialEvent.location,
          opponent: initialEvent.opponent || '',
          notes: initialEvent.notes || '',
          kind: initialEvent.kind || ENTRY_KIND.GAME,
        }
      : emptyForm(defaultDate, kind, prefillTeam, prefillTime)
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isAllocation = form.kind === ENTRY_KIND.ALLOCATION

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.team || !form.date) {
      setError('Team and date are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form, initialEvent?.id)
    } catch (err) {
      setError(err.message || 'Something went wrong saving this entry.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!initialEvent) return
    const msg = isAllocation
      ? 'Remove this time slot allocation for everyone?'
      : 'Remove this schedule entry for everyone?'
    if (!confirm(msg)) return
    setSaving(true)
    try {
      await onDelete(initialEvent.id)
    } catch (err) {
      setError(err.message || 'Could not delete this entry.')
      setSaving(false)
    }
  }

  const handleFillGame = () => {
    onFillGame({ team: form.team, date: form.date, time: form.time })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {isAllocation
            ? initialEvent
              ? 'Edit Time Slot Allocation'
              : 'Add Time Slot Allocation'
            : initialEvent
            ? 'Edit Schedule Entry'
            : 'Add Schedule Entry'}
        </h2>

        {isAllocation && (
          <p className="modal-hint">
            This just marks which team owns this ice time. It won't show up as a game -
            use "Fill In Game For This Slot" below once the details are known.
          </p>
        )}

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="team">Team</label>
            <select id="team" value={form.team} onChange={update('team')}>
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={form.date} onChange={update('date')} required />
          </div>

          <div className="field">
            <label htmlFor="time">Time</label>
            <input id="time" type="time" value={form.time} onChange={update('time')} />
          </div>

          {!isAllocation && (
            <>
              <div className="field">
                <label htmlFor="event_type">Type</label>
                <select id="event_type" value={form.event_type} onChange={update('event_type')}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Home or Away</label>
                <div className="loc-toggle">
                  <button
                    type="button"
                    data-loc="home"
                    data-active={form.location === 'home'}
                    onClick={() => setForm({ ...form, location: 'home' })}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    data-loc="away"
                    data-active={form.location === 'away'}
                    onClick={() => setForm({ ...form, location: 'away' })}
                  >
                    Away
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="opponent">Opponent (optional)</label>
                <input id="opponent" type="text" value={form.opponent} onChange={update('opponent')} placeholder="e.g. Stoughton" />
              </div>

              <div className="field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea id="notes" value={form.notes} onChange={update('notes')} placeholder="Rink, carpool, reminders..." />
              </div>
            </>
          )}

          {isAllocation && initialEvent && (
            <button type="button" className="btn-fill-game" onClick={handleFillGame} disabled={saving}>
              + Fill In Game For This Slot
            </button>
          )}

          <div className="modal-actions">
            <div>
              {initialEvent && (
                <button type="button" className="btn-delete" onClick={handleDelete} disabled={saving}>
                  Delete
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
