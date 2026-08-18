import { useState } from 'react'
import { REAL_TEAMS, ENTRY_KIND } from '../constants'
import { formatTime12h } from '../dateUtils'

function emptyRinkForm(kind, dateKey) {
  const isTournament = kind === ENTRY_KIND.TOURNAMENT
  return {
    kind,
    team: isTournament ? REAL_TEAMS[0] : null,
    date: dateKey || '',
    end_date: dateKey || '',
    all_day: isTournament,
    time: '',
    end_time: '',
    notes: '',
  }
}

export default function RinkEventModal({ initialEvent, defaultDate, onClose, onSave, onDelete }) {
  const [kind, setKind] = useState(initialEvent?.kind || ENTRY_KIND.TOURNAMENT)
  const [form, setForm] = useState(
    initialEvent
      ? {
          kind: initialEvent.kind,
          team: initialEvent.team,
          date: initialEvent.date,
          end_date: initialEvent.end_date || initialEvent.date,
          all_day: !!initialEvent.all_day,
          time: initialEvent.time || '',
          end_time: initialEvent.end_time || '',
          notes: initialEvent.notes || '',
        }
      : emptyRinkForm(ENTRY_KIND.TOURNAMENT, defaultDate)
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isTournament = kind === ENTRY_KIND.TOURNAMENT

  const switchKind = (nextKind) => {
    setKind(nextKind)
    setForm(emptyRinkForm(nextKind, defaultDate))
    setError('')
  }

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isTournament && !form.team) {
      setError('Pick a team for the tournament.')
      return
    }
    if (!form.date) {
      setError('Date is required.')
      return
    }
    if (isTournament && form.end_date && form.end_date < form.date) {
      setError('End date must be on or after the start date.')
      return
    }
    if (!isTournament && !form.all_day && (!form.time || !form.end_time)) {
      setError('Start and end time are required for an on-ice event (or check "All day").')
      return
    }
    if (!isTournament && !form.all_day && form.end_time <= form.time) {
      setError('End time must be after start time.')
      return
    }
    if (
      isTournament &&
      !form.all_day &&
      form.date === form.end_date &&
      form.time &&
      form.end_time &&
      form.end_time <= form.time
    ) {
      setError('End time must be after start time.')
      return
    }

    const payload = {
      kind,
      team: isTournament ? form.team : null,
      date: form.date,
      end_date: isTournament ? form.end_date || form.date : form.date,
      all_day: form.all_day,
      time: form.all_day ? null : form.time || null,
      end_time: form.all_day ? null : form.end_time || null,
      event_type: isTournament ? 'Tournament' : 'On-Ice Event',
      location: 'home',
      opponent: '',
      notes: form.notes,
    }

    setSaving(true)
    setError('')
    try {
      await onSave(payload, initialEvent?.id)
    } catch (err) {
      setError(err.message || 'Something went wrong saving this event.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!initialEvent) return
    if (!confirm('Remove this rink event? Individual ice-slot holds underneath it will reappear.')) return
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
        <h2>{initialEvent ? 'Edit Rink Event' : 'Add Rink Event'}</h2>

        {!initialEvent && (
          <div className="loc-toggle type-toggle" style={{ marginBottom: '16px' }}>
            <button
              type="button"
              data-active={isTournament}
              onClick={() => switchKind(ENTRY_KIND.TOURNAMENT)}
            >
              Tournament
            </button>
            <button
              type="button"
              data-active={!isTournament}
              onClick={() => switchKind(ENTRY_KIND.ON_ICE_EVENT)}
            >
              On-Ice Event
            </button>
          </div>
        )}

        <p className="modal-hint">
          {isTournament
            ? "A tournament hides every team's individual ice-slot holds for the dates it covers. It won't save if a home game is already scheduled in that window - move or remove the game first."
            : form.all_day
            ? 'An all-day on-ice event hides every ice-slot hold (any team) on this date, the same as an all-day tournament. It won’t save if a home game is already scheduled that day.'
            : 'An on-ice event hides any individual ice-slot holds (any team) that fall within its time range on this date. It won’t save if a home game is already scheduled in that window.'}
        </p>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isTournament && (
            <div className="field">
              <label htmlFor="rink-team">Team</label>
              <select id="rink-team" value={form.team || ''} onChange={update('team')}>
                {REAL_TEAMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="rink-date">{isTournament ? 'Start Date' : 'Date'}</label>
            <input id="rink-date" type="date" value={form.date} onChange={update('date')} required />
          </div>

          {isTournament && (
            <div className="field">
              <label htmlFor="rink-end-date">End Date</label>
              <input id="rink-end-date" type="date" value={form.end_date} onChange={update('end_date')} required />
            </div>
          )}

          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={form.all_day}
                onChange={(e) => setForm({ ...form, all_day: e.target.checked })}
              />{' '}
              All day
            </label>
          </div>

          {!form.all_day && (
            <>
              <div className="field">
                <label htmlFor="rink-time">Start Time</label>
                <input
                  id="rink-time"
                  type="time"
                  value={form.time}
                  onChange={update('time')}
                  required={!form.all_day}
                />
              </div>
              <div className="field">
                <label htmlFor="rink-end-time">End Time</label>
                <input
                  id="rink-end-time"
                  type="time"
                  value={form.end_time}
                  onChange={update('end_time')}
                  required={!form.all_day}
                />
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="rink-notes">Notes (optional)</label>
            <textarea
              id="rink-notes"
              value={form.notes}
              onChange={update('notes')}
              placeholder="Details, host rink, etc."
            />
          </div>

          {initialEvent && (
            <p className="modal-hint">
              {isTournament
                ? `Covers ${initialEvent.date}${initialEvent.end_date && initialEvent.end_date !== initialEvent.date ? ` – ${initialEvent.end_date}` : ''}${initialEvent.all_day ? ' · All day' : ''}`
                : initialEvent.all_day
                ? `${initialEvent.date} · All day`
                : `${initialEvent.date} · ${formatTime12h(initialEvent.time)} – ${formatTime12h(initialEvent.end_time)}`}
            </p>
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
