import { formatDateLabel, formatTime12h } from '../dateUtils'

export default function AvailableSlotsModal({ team, slots, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Available Slots — {team}</h2>
        <p className="modal-hint">
          Ice time already allocated to {team} that doesn't have a game filled in yet.
        </p>

        {slots.length === 0 ? (
          <p>No open slots for {team} right now - every allocated slot has a game filled in.</p>
        ) : (
          <ul className="slots-list">
            {slots.map((slot) => (
              <li key={slot.id} className="slots-list-item">
                <span className="slots-list-date">{formatDateLabel(slot.date)}</span>
                <span className="slots-list-time">{slot.time ? formatTime12h(slot.time) : 'Time TBD'}</span>
              </li>
            ))}
          </ul>
        )}

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
