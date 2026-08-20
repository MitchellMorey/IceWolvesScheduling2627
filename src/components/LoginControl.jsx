import { useState } from 'react'

export default function LoginControl({ userEmail, isEditor, authLoading, sendMagicLink, signOut }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const closeModal = () => {
    setModalOpen(false)
    setStatus('idle')
    setError('')
    setEmail('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      await sendMagicLink(email.trim())
      setStatus('sent')
    } catch (err) {
      setError(err.message || 'Could not send the link. Try again.')
      setStatus('error')
    }
  }

  if (authLoading) return null

  if (userEmail) {
    return (
      <div className="login-control">
        <span className="login-status" title={isEditor ? 'Signed in as an approved editor' : 'Signed in - view only'}>
          {userEmail}{!isEditor && ' (view only)'}
        </span>
        <button type="button" className="login-link-btn" onClick={signOut}>Log Out</button>
      </div>
    )
  }

  return (
    <div className="login-control">
      <button type="button" className="login-link-btn" onClick={() => setModalOpen(true)}>
        Log In
      </button>

      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Log In</h2>
            <p className="modal-hint">
              Enter your email and we'll send you a magic link. Anyone can view the schedule -
              only approved editors can add or change anything.
            </p>

            {status === 'sent' ? (
              <p>Check your email for a sign-in link.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                {status === 'error' && <div className="modal-error">{error}</div>}
                <div className="field">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="modal-actions">
                  <div />
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={status === 'sending'}>
                      {status === 'sending' ? 'Sending…' : 'Send Magic Link'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {status === 'sent' && (
              <div className="modal-actions">
                <div />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button type="button" className="btn-primary" onClick={closeModal}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
