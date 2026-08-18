import { useState } from 'react'
import { formatDateLabel, formatTime12h } from '../dateUtils'

function buildClipboardText(team, slots, travelDates) {
  const lines = ['Available Ice in Dodgeville']
  if (slots.length === 0) {
    lines.push(`No open slots for ${team} right now - every allocated slot has a game filled in.`)
  } else {
    slots.forEach((slot) => {
      lines.push(`${formatDateLabel(slot.date)} - ${slot.time ? formatTime12h(slot.time) : 'Time TBD'}`)
    })
  }

  lines.push('')
  lines.push('Available to Travel')
  if (travelDates.length === 0) {
    lines.push(`No open weekends for ${team} right now - every Saturday/Sunday has a game or tournament.`)
  } else {
    travelDates.forEach((dateKey) => lines.push(formatDateLabel(dateKey)))
  }

  return lines.join('\n')
}

// Rich (HTML) version of the same content, so pasting into email/Word/Docs
// keeps table structure and bold headers - the same as dragging to select
// and copying by hand would produce, instead of flat plain text.
function buildClipboardHtml(team, slots, travelDates) {
  const tableStyle = 'border-collapse:collapse;margin:0 0 16px;font-family:sans-serif;font-size:13px;'
  const cellStyle = 'border:1px solid #ccc;padding:4px 10px;text-align:left;'
  const headingStyle = 'font-family:sans-serif;font-size:15px;margin:0 0 6px;'

  const slotRows =
    slots.length === 0
      ? `<tr><td style="${cellStyle}">No open slots for ${team} right now - every allocated slot has a game filled in.</td></tr>`
      : slots
          .map(
            (slot) =>
              `<tr><td style="${cellStyle}">${formatDateLabel(slot.date)}</td><td style="${cellStyle}">${
                slot.time ? formatTime12h(slot.time) : 'Time TBD'
              }</td></tr>`
          )
          .join('')

  const travelRows =
    travelDates.length === 0
      ? `<tr><td style="${cellStyle}">No open weekends for ${team} right now - every Saturday/Sunday has a game or tournament.</td></tr>`
      : travelDates.map((dateKey) => `<tr><td style="${cellStyle}">${formatDateLabel(dateKey)}</td></tr>`).join('')

  return `
    <div>
      <h3 style="${headingStyle}">Available Ice in Dodgeville</h3>
      <table style="${tableStyle}"><tbody>${slotRows}</tbody></table>
      <h3 style="${headingStyle}">Available to Travel</h3>
      <table style="${tableStyle}"><tbody>${travelRows}</tbody></table>
    </div>
  `
}

export default function AvailableSlotsModal({ team, slots, travelDates, onClose }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = buildClipboardText(team, slots, travelDates)
    try {
      if (window.ClipboardItem) {
        const html = buildClipboardHtml(team, slots, travelDates)
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'text/html': new Blob([html], { type: 'text/html' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(text)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access can be blocked by the browser - fail quietly.
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-copy-row">
          <button type="button" className="modal-copy-btn" onClick={handleCopy} title="Copy both tables">
            {copied ? 'Copied!' : '⧉ Copy'}
          </button>
        </div>

        <h2>Available Ice in Dodgeville</h2>

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

        <p className="modal-hint">
          Ice time already allocated to {team} that doesn't have a game filled in yet.
        </p>

        <h2>Available to Travel</h2>

        {travelDates.length === 0 ? (
          <p>No open weekends for {team} right now - every Saturday/Sunday has a game or tournament.</p>
        ) : (
          <ul className="slots-list">
            {travelDates.map((dateKey) => (
              <li key={dateKey} className="slots-list-item">
                <span className="slots-list-date">{formatDateLabel(dateKey)}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="modal-hint">
          Saturdays/Sundays with no {team} game or tournament (individual or multi-day) scheduled - open for {team} to travel to an away game.
        </p>

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
