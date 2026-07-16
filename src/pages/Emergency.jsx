import { useState } from 'react'
import LostChildWorkflow from '../components/LostChildWorkflow.jsx'

const REASONS = ['Medical', 'Lost child', 'Accessibility assistance', 'Security', 'Lost item', 'Other']

const urgencyColor = { critical: 'var(--danger)', high: 'var(--amber)', medium: 'var(--accent)', low: 'var(--text-secondary)' }

const REASON_INFO = {
  Medical: 'Routed to the nearest medical-trained volunteer and on-site paramedic team. Fastest response tier.',
  'Lost child': 'Opens a dedicated search workflow: staged search radius, live gate prioritization, and continuous status updates.',
  'Accessibility assistance': 'A mobility-assist volunteer is sent to your location with any needed equipment.',
  Security: 'Directly alerts the security team. Move to a visible, safe location if you can.',
  'Lost item': "You'll be directed to the nearest lost-and-found desk.",
  Other: 'A general-purpose volunteer is dispatched to assess the situation.',
}

export default function Emergency() {
  const [reason, setReason] = useState(REASONS[0])
  const [mode, setMode] = useState('select')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (reason === 'Lost child') {
      setMode('lostChild')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
    } catch {
      setError('Could not reach dispatch. Try again, or find the nearest volunteer directly.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setError(null)
    setMode('select')
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 1rem', fontSize: '20px', fontFamily: 'var(--font-display)' }}>REQUEST ASSISTANCE</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem', alignItems: 'start' }}>
        <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '16px', padding: '1.5rem' }}>
          {mode === 'lostChild' ? (
            <LostChildWorkflow onCancel={reset} />
          ) : result ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: urgencyColor[result.incident.urgency] }} />
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: urgencyColor[result.incident.urgency] }}>
                  {result.incident.urgency} priority
                </span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '14px', lineHeight: 1.5 }}>{result.message}</p>
              <div className="scoreboard" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                ETA ~{result.incident.etaMin} min · dispatched from {result.incident.dispatchFrom}
              </div>
              <button onClick={reset} className="hover-lift" style={{ width: '100%', background: 'var(--accent)', border: 'none', color: '#04070f', borderRadius: '10px', padding: '10px', fontWeight: 600 }}>
                Send another request
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>What do you need help with?</h2>
              <div style={{ display: 'grid', gap: '6px', marginBottom: '16px' }}>
                {REASONS.map((r) => (
                  <label
                    key={r}
                    className="hover-lift"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      background: reason === r ? 'var(--bg-panel-raised)' : 'transparent',
                      border: `1px solid ${reason === r ? 'var(--line-strong)' : 'transparent'}`,
                      borderRadius: '8px',
                      padding: '8px 10px',
                    }}
                  >
                    <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                    {r}
                  </label>
                ))}
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '10px' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="hover-lift"
                style={{ width: '100%', background: 'var(--danger)', border: 'none', color: '#04070f', borderRadius: '10px', padding: '12px', fontWeight: 700, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Sending…' : reason === 'Lost child' ? 'Continue' : 'Send request'}
              </button>
            </form>
          )}
        </div>

        {mode !== 'lostChild' && (
          <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '16px', padding: '1.25rem' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              What happens next
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {REASON_INFO[reason]}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
