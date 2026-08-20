import { useState } from 'react'
import { TEAMS, EVENT_TYPES, ENTRY_KIND } from '../constants'
import { formatTime12h } from '../dateUtils'

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

function GroupAllocationRow({ allocation, onReassignRow, onDeleteRow, onFillGame, onRowRemoved }) {
  const [team, setTeam] = useState(allocation.team)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleReassign = async (e) => {
    const nextTeam = e.target.value
    setTeam(nextTeam)
    setSaving(true)
    setError('')
    try {
      await onReassignRow(allocation.id, nextTeam)
    } catch (err) {
      setError(err.message || 'Could not reassign this slot.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Remove this team’s hold on this slot?')) return
    setSaving(true)
    try {
      await onDeleteRow(allocation.id)
      onRowRemoved(allocation.id)
    } catch (err) {
      setError(err.message || 'Could not remove this slot.')
      setSaving(false)
    }
  }

  return (
    <div className="group-row">
      <select value={team} onChange={handleReassign} disabled={saving}>
        {TEAMS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <button
        type="button"
        className="btn-fill-game btn-fill-game-compact"
        onClick={() => onFillGame({ team, date: allocation.date, time: allocation.time })}
        disabled={saving}
      >
        + Fill In Game
      </button>
      <button type="button" className="btn-delete" onClick={handleDelete} disabled={saving}>
        Delete
      </button>
      {error && <div className="modal-error">{error}</div>}
    </div>
  )
}

function GroupAllocationModal({ group, readOnly, onClose, onReassignRow, onDeleteRow, onFillGame }) {
  const [rows, setRows] = useState(group)
  const time = rows[0]?.time
  const date = rows[0]?.date

  const handleRowRemoved = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Shared Time Slot{time ? ` — ${formatTime12h(time)}` : ''}</h2>
        <p className="modal-hint">
          {readOnly
            ? 'These teams share this ice time.'
            : "These teams share this ice time. Reassign a team, remove its hold, or fill in a game for whichever team is actually playing - the other team's hold stays as-is."}
        </p>

        {rows.length === 0 && <p>No teams left holding this slot.</p>}

        {readOnly
          ? rows.map((allocation) => (
              <div className="group-row" key={allocation.id}>
                <span>{allocation.team}</span>
              </div>
            ))
          : rows.map((allocation) => (
              <GroupAllocationRow
                key={allocation.id}
                allocation={allocation}
                onReassignRow={onReassignRow}
                onDeleteRow={onDeleteRow}
                onFillGame={onFillGame}
                onRowRemoved={handleRowRemoved}
              />
            ))}

        <div className="modal-actions">
          <div />
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button type="button" className="btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EventModal({
  initialEvent,
  group,
  defaultDate,
  kind = ENTRY_KIND.GAME,
  prefillTeam,
  prefillTime,
  readOnly = false,
  onClose,
  onSave,
  onDelete,
  onReassignRow,
  onDeleteRow,
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

  if (group && group.length > 0) {
    return (
      <GroupAllocationModal
        group={group}
        readOnly={readOnly}
        onClose={onClose}
        onReassignRow={onReassignRow}
        onDeleteRow={onDeleteRow}
        onFillGame={onFillGame}
      />
    )
  }

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
          {readOnly
            ? isAllocation
              ? 'Time Slot Allocation'
              : 'Schedule Entry'
            : isAllocation
            ? initialEvent
              ? 'Edit Time Slot Allocation'
              : 'Add Time Slot Allocation'
            : initialEvent
            ? 'Edit Schedule Entry'
            : 'Add Schedule Entry'}
        </h2>

        {isAllocation && !readOnly && (
          <p className="modal-hint">
            This just marks which team owns this ice time. It won't show up as a game -
            use "Fill In Game For This Slot" below once the details are known.
          </p>
        )}

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="team">Team</label>
            <select id="team" value={form.team} onChange={update('team')} disabled={readOnly}>
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={form.date} onChange={update('date')} required disabled={readOnly} />
          </div>

          <div className="field">
            <label htmlFor="time">Time</label>
            <input id="time" type="time" value={form.time} onChange={update('time')} disabled={readOnly} />
          </div>

          {!isAllocation && (
            <>
              <div className="field">
                <label htmlFor="event_type">Type</label>
                <select id="event_type" value={form.event_type} onChange={update('event_type')} disabled={readOnly}>
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
                    onClick={() => !readOnly && setForm({ ...form, location: 'home' })}
                    disabled={readOnly}
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    data-loc="away"
                    data-active={form.location === 'away'}
                    onClick={() => !readOnly && setForm({ ...form, location: 'away' })}
                    disabled={readOnly}
                  >
                    Away
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="opponent">Opponent (optional)</label>
                <input id="opponent" type="text" value={form.opponent} onChange={update('opponent')} placeholder="e.g. Stoughton" disabled={readOnly} />
              </div>

              <div className="field">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea id="notes" value={form.notes} onChange={update('notes')} placeholder="Rink, carpool, reminders..." disabled={readOnly} />
              </div>
            </>
          )}

          {isAllocation && initialEvent && !readOnly && (
            <button type="button" className="btn-fill-game" onClick={handleFillGame} disabled={saving}>
              + Fill In Game For This Slot
            </button>
          )}

          <div className="modal-actions">
            <div>
              {initialEvent && !readOnly && (
                <button type="button" className="btn-delete" onClick={handleDelete} disabled={saving}>
                  Delete
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {readOnly ? (
                <button type="button" className="btn-primary" onClick={onClose}>Close</button>
              ) : (
                <>
                  <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
