import { useRef, useState } from 'react'
import { formatDateLabel, formatTime12h } from '../dateUtils'

export default function AvailableSlotsModal({ team, slots, travelDates, onClose }) {
  const [copied, setCopied] = useState(false)
  const heading1Ref = useRef(null)
  const list1Ref = useRef(null)
  const heading2Ref = useRef(null)
  const list2Ref = useRef(null)

  // Copies the actual rendered headings + lists (skipping the yellow hint
  // paragraphs) by cloning the live, styled DOM nodes into an offscreen
  // container and running the browser's own copy command on them - this
  // matches a manual click-drag-select-and-copy exactly, instead of
  // reconstructing a lookalike table by hand.
  const handleCopy = () => {
    const container = document.createElement('div')
    container.className = 'modal'
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '-9999px'
    container.style.opacity = '0'
    container.style.pointerEvents = 'none'
    // The modal's own width (100%, capped at 460px) is meant to fill a
    // popup - copied as-is, some paste targets (e.g. an email compose
    // window) stretch it to fill their own, much wider body, leaving a
    // big empty gap to the right. Shrink-to-fit instead so the copied
    // content is only ever as wide as its longest line.
    container.style.width = 'fit-content'
    container.style.maxWidth = 'none'

    ;[heading1Ref, list1Ref, heading2Ref, list2Ref].forEach((ref) => {
      if (ref.current) container.appendChild(ref.current.cloneNode(true))
    })

    // The on-screen list scrolls (max-height + overflow-y) so the popup
    // itself stays a fixed size, but that same scroll clipping would carry
    // into the clipboard as a cramped, scrollable table. Let the copied
    // version expand to show every row instead, and shrink its width to
    // fit its content rather than stretching to fill the modal.
    container.querySelectorAll('.slots-list').forEach((list) => {
      list.style.maxHeight = 'none'
      list.style.overflow = 'visible'
      list.style.width = 'fit-content'
    })

    document.body.appendChild(container)

    const range = document.createRange()
    range.selectNodeContents(container)
    const selection = window.getSelection()
    const previousRanges = []
    for (let i = 0; i < selection.rangeCount; i++) previousRanges.push(selection.getRangeAt(i))
    selection.removeAllRanges()
    selection.addRange(range)

    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }

    selection.removeAllRanges()
    previousRanges.forEach((r) => selection.addRange(r))
    document.body.removeChild(container)

    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
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

        <h2 ref={heading1Ref}>Available Ice in Dodgeville</h2>

        <div ref={list1Ref}>
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
        </div>

        <p className="modal-hint">
          Ice time already allocated to {team} that doesn't have a game filled in yet.
        </p>

        <h2 ref={heading2Ref}>Available to Travel</h2>

        <div ref={list2Ref}>
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
        </div>

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
