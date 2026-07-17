import { useState, useRef, useEffect } from 'react'
import { useSession } from '../state/SessionContext.jsx'
import { useAgentActivity } from '../state/AgentActivityContext.jsx'
import AgentDebate from './AgentDebate.jsx'

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Arabic']

const AGENT_LABELS = {
  recommend_entrance: 'Navigation Agent',
  assess_crowd_risk: 'Crowd Intelligence Agent',
  plan_accessible_route: 'Accessibility Agent',
  lookup_venue_policy: 'Venue Knowledge Agent',
  check_service_wait: 'Operations Agent',
  recommend_transport: 'Transportation Agent',
  remember_fact: 'Memory',
}

function summarizeStep(step) {
  const { agent, input, output } = step
  switch (agent) {
    case 'recommend_entrance':
      return `Recommended ${output.recommendation} (${Math.round((output.confidence || 0) * 100)}% confidence)`
    case 'assess_crowd_risk':
      return output.shouldReroute ? `Flagged congestion — suggested ${output.suggestedGate}` : 'No congestion risk found'
    case 'plan_accessible_route':
      return `Planned accessible route via ${output.entrance}`
    case 'lookup_venue_policy':
      return `Looked up ${input?.topic || 'venue policy'}`
    case 'check_service_wait':
      return input?.serviceId ? `Checked wait time for ${input.serviceId}` : 'Checked all service wait times'
    case 'recommend_transport':
      return `Recommended ${output.recommendation} (${Math.round((output.confidence || 0) * 100)}% confidence)`
    case 'remember_fact':
      return `Saved ${output.key}: ${output.value}`
    default:
      return 'Ran'
  }
}

export default function AIAssistant() {
  const { memory, remember } = useSession()
  const { logActivity } = useAgentActivity()
  const [language, setLanguage] = useState('English')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! Ask me about gates, wait times, directions, or accessibility help.', intro: true },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const history = messages
        .filter((m) => !m.intro)
        .map((m) => ({ role: m.role, text: m.text }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language, memory, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      for (const step of data.reasoning || []) {
        if (step.agent === 'remember_fact' && step.output?.saved) {
          remember(step.output.key, step.output.value)
        }
        logActivity(AGENT_LABELS[step.agent] || step.agent, summarizeStep(step))
      }

      setMessages((m) => [...m, { role: 'assistant', text: data.reply, reasoning: data.reasoning }])
    } catch (err) {
      setError('Could not reach the assistant. Is GEMINI_API_KEY set on the server?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      aria-labelledby="assistant-heading"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 id="assistant-heading" style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Ask StadiumMind
        </h2>
        <label>
          <span className="sr-only">Response language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: 'var(--bg-panel-raised)',
              color: 'var(--floodlight)',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '12px',
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      <div
        ref={scrollRef}
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '0.75rem' }}
        role="log"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div key={i} className="msg-in" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', animationDelay: `${Math.min(i, 6) * 0.04}s` }}>
            <div
              style={{
                background: m.role === 'user' ? 'var(--accent-dim)' : 'var(--bg-panel-raised)',
                color: 'var(--floodlight)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {m.text}
            </div>
            {m.reasoning && m.reasoning.length > 0 && (
              <div style={{ marginTop: '6px', display: 'grid', gap: '4px' }}>
                {m.reasoning.length > 1 && (
                  <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {m.reasoning.length} agents collaborated on this answer
                  </p>
                )}
                {m.reasoning.map((r, j) => (
                  <div
                    key={j}
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      padding: '6px 8px',
                    }}
                  >
                    <strong style={{ color: 'var(--accent)' }}>{AGENT_LABELS[r.agent] || r.agent}:</strong> {summarizeStep(r)}
                    {r.healed && (
                      <span style={{ marginLeft: '6px', color: 'var(--amber)', fontSize: '10px', border: '1px solid var(--amber)', borderRadius: '4px', padding: '0 4px' }}>
                        self-corrected
                      </span>
                    )}
                    {r.output?.reason && <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>{r.output.reason}</div>}
                    {r.output?.alternative && <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>Alternative: {r.output.alternative}</div>}
                  </div>
                ))}
                <AgentDebate reasoning={m.reasoning} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '12px' }}>
            StadiumMind is thinking…
          </div>
        )}
        {error && (
          <div style={{ color: 'var(--danger)', fontSize: '12px' }}>{error}</div>
        )}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Where's the nearest accessible restroom?"
          aria-label="Ask StadiumMind a question"
          style={{
            flex: 1,
            background: 'var(--bg-panel-raised)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: 'var(--floodlight)',
            fontSize: '13px',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--accent)',
            color: '#08130e',
            border: 'none',
            borderRadius: '8px',
            padding: '0 16px',
            fontWeight: 600,
            fontSize: '13px',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </form>
    </section>
  )
}
