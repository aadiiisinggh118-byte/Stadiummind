import { useState, useEffect, useRef } from 'react'
import { getStage } from '../lib/agents/lostChildAgent.js'
import { useLiveData } from '../state/LiveDataContext.jsx'
import { useAgentActivity } from '../state/AgentActivityContext.jsx'

const STAGE_COLOR = { immediate: 'var(--amber)', expanding: 'var(--amber)', escalated: 'var(--danger)' }

export default function LostChildWorkflow({ onCancel }) {
  const { gates } = useLiveData()
  const { logActivity } = useAgentActivity()
  const [phase, setPhase] = useState('intake') // 'intake' | 'active'
  const [age, setAge] = useState('')
  const [description, setDescription] = useState('')
  const [lastSeenGateId, setLastSeenGateId] = useState(gates[0]?.id || 'A')

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [plan, setPlan] = useState(null)
  const [log, setLog] = useState([]) // [{ time, message }]
  const [loading, setLoading] = useState(false)
  const lastStageRef = useRef(null)

  // Real-time clock while the search is active.
  useEffect(() => {
    if (phase !== 'active') return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [phase])

  async function fetchUpdate(seconds) {
    setLoading(true)
    try {
      const res = await fetch('/api/lost-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age, description, lastSeenGateId, elapsedSeconds: seconds }),
      })
      const data = await res.json()
      setPlan(data.plan)
      setLog((l) => [...l, { time: seconds, message: data.message, stage: data.plan.stage }])
      logActivity('Lost Child Agent', `${data.plan.stageLabel} — ${data.plan.priorityGates.length} gate(s) prioritized`)
    } catch {
      setLog((l) => [...l, { time: seconds, message: 'Could not reach dispatch — retrying shortly.', stage: 'error' }])
    } finally {
      setLoading(false)
    }
  }

  function startSearch(e) {
    e.preventDefault()
    setPhase('active')
    lastStageRef.current = getStage(0)
    fetchUpdate(0)
  }

  // Trigger a fresh plan + message whenever the escalation stage changes.
  useEffect(() => {
    if (phase !== 'active') return
    const stage = getStage(elapsedSeconds)
    if (stage !== lastStageRef.current) {
      lastStageRef.current = stage
      fetchUpdate(elapsedSeconds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, phase])

  function fastForward() {
    setElapsedSeconds((s) => s + 90)
  }

  function reset() {
    setPhase('intake')
    setElapsedSeconds(0)
    setPlan(null)
    setLog([])
    lastStageRef.current = null
  }

  if (phase === 'intake') {
    return (
      <form onSubmit={startSearch}>
        <h2 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Lost child details</h2>
        <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Age (approx.)
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 7"
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Description (clothing, appearance)
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. red jacket, blue backpack"
              style={inputStyle}
            />
          </label>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Last seen near
            <select value={lastSeenGateId} onChange={(e) => setLastSeenGateId(e.target.value)} style={inputStyle}>
              {gates.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--floodlight)', borderRadius: '8px', padding: '10px' }}>
            Cancel
          </button>
          <button type="submit" style={{ flex: 1, background: 'var(--danger)', border: 'none', color: '#04070f', borderRadius: '8px', padding: '10px', fontWeight: 700 }}>
            Start search
          </button>
        </div>
      </form>
    )
  }

  const stage = getStage(elapsedSeconds)
  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
  const ss = String(elapsedSeconds % 60).padStart(2, '0')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: STAGE_COLOR[stage] }} />
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: STAGE_COLOR[stage] }}>
            {plan?.stageLabel || 'Starting search'}
          </span>
        </div>
        <span className="scoreboard" style={{ fontSize: '16px' }}>{mm}:{ss}</span>
      </div>

      {plan && (
        <div style={{ background: 'var(--bg-panel-raised)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 4px' }}><strong style={{ color: 'var(--accent)' }}>Reasoning:</strong> {plan.reasoning}</p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--accent)' }}>Priority gates:</strong> {plan.priorityGates.map((g) => g.name).join(', ')}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '8px', marginBottom: '16px', maxHeight: '220px', overflowY: 'auto' }} role="log" aria-live="polite">
        {log.map((entry, i) => {
          const m = String(Math.floor(entry.time / 60)).padStart(2, '0')
          const s = String(entry.time % 60).padStart(2, '0')
          return (
            <div key={i} style={{ fontSize: '13px', display: 'flex', gap: '8px' }}>
              <span className="scoreboard" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{m}:{s}</span>
              <span>{entry.message}</span>
            </div>
          )
        })}
        {loading && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Updating…</span>}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={fastForward} style={{ flex: 1, background: 'var(--bg-panel-raised)', border: '1px solid var(--line-strong)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '10px', fontSize: '12px' }}>
          Demo: skip ahead 90s
        </button>
        <button onClick={reset} style={{ flex: 1, background: 'var(--accent)', border: 'none', color: '#08130e', borderRadius: '8px', padding: '10px', fontWeight: 600, fontSize: '12px' }}>
          Child found — end search
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: '4px',
  background: 'var(--bg-panel-raised)',
  border: '1px solid var(--line)',
  borderRadius: '8px',
  padding: '8px 10px',
  color: 'var(--floodlight)',
  fontSize: '13px',
}
