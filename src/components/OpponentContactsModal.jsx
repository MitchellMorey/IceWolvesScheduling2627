import { useState } from 'react'
import { SCHEDULED_OPTIONS } from '../constants'

function ContactRow({ contact, onUpdate, onDelete, autoEdit }) {
  const [editing, setEditing] = useState(autoEdit)
  const [club, setClub] = useState(contact.club)
  const [contactName, setContactName] = useState(contact.contact)
  const [email, setEmail] = useState(contact.email)
  const [deleting, setDeleting] = useState(false)

  // Text fields save on blur (so we're not firing a network call per
  // keystroke) - only if the value actually changed. The Scheduled
  // dropdown saves immediately since there's no typing to debounce.
  const commit = (field, value, original) => {
    if (value === original) return
    onUpdate(contact.id, { [field]: value })
  }

  const startEditing = () => {
    // Re-sync from the current row in case it changed since last edit.
    setClub(contact.club)
    setContactName(contact.contact)
    setEmail(contact.email)
    setEditing(true)
  }

  const handleDelete = async () => {
    if (!confirm(`Remove ${contact.club || 'this contact'}?`)) return
    setDeleting(true)
    try {
      await onDelete(contact.id)
    } catch (err) {
      alert(err.message || 'Could not remove this contact.')
      setDeleting(false)
    }
  }

  return (
    <tr>
      <td>
        {editing ? (
          <input
            type="text"
            value={club}
            onChange={(e) => setClub(e.target.value)}
            onBlur={() => commit('club', club, contact.club)}
            placeholder="Club name"
            disabled={deleting}
            autoFocus
          />
        ) : (
          <span className="contacts-view-text">{contact.club || '—'}</span>
        )}
      </td>
      <td>
        {editing ? (
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            onBlur={() => commit('contact', contactName, contact.contact)}
            placeholder="Contact name"
            disabled={deleting}
          />
        ) : (
          <span className="contacts-view-text">{contact.contact || '—'}</span>
        )}
      </td>
      <td>
        {editing ? (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => commit('email', email, contact.email)}
            placeholder="Email"
            disabled={deleting}
          />
        ) : (
          <span className="contacts-view-text">{contact.email || '—'}</span>
        )}
      </td>
      <td>
        {editing ? (
          <select
            value={contact.scheduled}
            onChange={(e) => onUpdate(contact.id, { scheduled: e.target.value })}
            disabled={deleting}
          >
            {SCHEDULED_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <span className="contacts-view-text">{contact.scheduled}</span>
        )}
      </td>
      <td className="contacts-actions-cell">
        <div className="contacts-actions-row">
          <button
            type="button"
            className="contacts-icon-btn"
            onClick={() => (editing ? setEditing(false) : startEditing())}
            disabled={deleting}
            title={editing ? 'Done editing' : 'Edit this contact'}
            aria-label={editing ? 'Done editing' : 'Edit this contact'}
          >
            {editing ? '✓' : '✎'}
          </button>
          <button
            type="button"
            className="contacts-icon-btn contacts-icon-btn-delete"
            onClick={handleDelete}
            disabled={deleting}
            title="Remove this contact"
            aria-label="Remove this contact"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function OpponentContactsModal({ team, contacts, onAddContact, onUpdateContact, onDeleteContact, onClose }) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [newlyAddedId, setNewlyAddedId] = useState(null)

  const handleAdd = async () => {
    setAdding(true)
    setError('')
    try {
      const created = await onAddContact(team)
      if (created) setNewlyAddedId(created.id)
    } catch (err) {
      setError(err.message || 'Could not add a contact.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>{team} Opponent Contacts</h2>

        {error && <div className="modal-error">{error}</div>}

        {contacts.length === 0 ? (
          <p className="modal-hint">No opponent contacts yet for {team} - add one below.</p>
        ) : (
          <div className="contacts-table-wrap">
            <table className="contacts-table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Scheduled</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onUpdate={onUpdateContact}
                    onDelete={onDeleteContact}
                    autoEdit={contact.id === newlyAddedId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions">
          <div>
            <button type="button" className="btn-secondary" onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding…' : '+ Add Contact'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button type="button" className="btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}
