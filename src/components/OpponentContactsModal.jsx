import { useState } from 'react'
import { SCHEDULED_OPTIONS } from '../constants'

function ContactRow({ contact, onUpdate, onDelete }) {
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
        <input
          type="text"
          value={club}
          onChange={(e) => setClub(e.target.value)}
          onBlur={() => commit('club', club, contact.club)}
          placeholder="Club name"
          disabled={deleting}
        />
      </td>
      <td>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          onBlur={() => commit('contact', contactName, contact.contact)}
          placeholder="Contact name"
          disabled={deleting}
        />
      </td>
      <td>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => commit('email', email, contact.email)}
          placeholder="Email"
          disabled={deleting}
        />
      </td>
      <td>
        <select
          value={contact.scheduled}
          onChange={(e) => onUpdate(contact.id, { scheduled: e.target.value })}
          disabled={deleting}
        >
          {SCHEDULED_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </td>
      <td className="contacts-delete-cell">
        <button type="button" className="btn-delete" onClick={handleDelete} disabled={deleting}>
          Delete
        </button>
      </td>
    </tr>
  )
}

export default function OpponentContactsModal({ team, contacts, onAddContact, onUpdateContact, onDeleteContact, onClose }) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    setAdding(true)
    setError('')
    try {
      await onAddContact(team)
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
