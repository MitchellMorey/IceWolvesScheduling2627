import { useState } from 'react'
import { TEAMS, EVENT_TYPES } from '../constants'

const emptyForm = (dateKey) => ({
  team: TEAMS[0],
  date: dateKey || '',
  time: '',
  event_type: 'Game',
  location: 'home',
  opponent: '',
  notes: '',
})

export default function EventModal({ initialEvent, defaultDate, onClose, onSave, onDelete }) {
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
        }
      : emptyForm(defaultDate)
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
      setError(err.message || 'Something went wrong saving this event.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!initialEvent) return
    if (!confirm('Remove this schedule entry for everyone?')) return
    setSaving(true)
    try {
      await onDelete(initialEvent.id)
    } catch (err) {
      setError(err.message || 'Could not delete this event.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initialEvent ? 'Edit Schedule Entry' : 'Add Schedule Entry'}</h2>

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
