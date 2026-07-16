import { useState, useRef, useEffect } from 'react'
import { SCENARIOS, runSimulation, detectThresholdAlerts } from '../lib/agents/simulationAgent.js'
import { useLiveData } from '../state/LiveDataContext.jsx'
import { useAgentActivity } from '../state/AgentActivityContext.jsx'
import AnimatedNumber from '../components/AnimatedNumber.jsx'
import AgentsWorkingPanel from '../components/AgentsWorkingPanel.jsx'

const TICK_MS = 900

const METRIC_META = {
  volunteerWorkload: { label: 'Volunteer workload', invert: true },
  emergencyResponseEfficiency: { label: 'Emergency response efficiency', invert: false },
  accessibilityImpact: { label: 'Accessibility impact', invert: true },
  safetyRisk: { label: 'Safety risk', invert: true },
}

function metricColor(value, invert) {
  const good = invert ? value < 35 : value > 65
  const bad = invert ? value > 65 : value < 35
  if (good) return 'var(--accent)'
  if (bad) return 'var(--danger)'
  return 'var(--amber)'
}

function healthColor(score) {
  if (score >= 70) return 'var(--accent)'
  if (score >= 40) return 'var(--amber)'
  return 'var(--danger)'
}

export default function DigitalTwin() {
  const { gates: liveGates } = useLiveData()
  const { logActivity } = useAgentActivity()

  const [scenarioId, setScenarioId] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | playing | done
  const [timeline, setTimeline] = useState(null)
  const [minuteIndex, setMinuteIndex] = useState(0)
  const [alerts, setAlerts] = useState([])
  const [planner, setPlanner] = useState(null)
  const [plannerLoading, setPlannerLoading] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => () => clearInterval(intervalRef.current), [])

  function trigger(id) {
    clearInterval(intervalRef.current)
    const tl = runSimulation(id, liveGates, 6)
    setScenarioId(id)
    setTimeline(tl)
    setMinuteIndex(0)
    setAlerts([])
    setPlanner(null)
    setPhase('playing')
    logActivity('Planner Agent', `Simulating "${SCENARIOS[id].label}" over the next 6 minutes`)

    let i = 0
    intervalRef.current = setInterval(() => {
      i += 1
      setMinuteIndex(i)
      setAlerts((prev) => {
        const newAlerts = detectThresholdAlerts(tl[i], tl[i - 1])
        newAlerts.forEach((a) => logActivity('Digital Twin Monitor', a.text))
        return [...prev, ...newAlerts]
      })
      if (i >= tl.length - 1) {
        clearInterval(intervalRef.current)
        setPhase('done')
        fetchPlanner(id, tl[tl.length - 1])
      }
    }, TICK_MS)
  }

  async function fetchPlanner(id, finalState) {
    setPlannerLoading(true)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: id,
          finalGates: finalState.gates,
          finalMetrics: finalState.metrics,
          language: 'English',
        }),
      })
      const data = await res.json()
      setPlanner(data)
    } catch {
      setPlanner({ narrative: 'Could not reach the Planner Agent — showing the simulated data only.', agentOpinions: null, actions: [] })
    } finally {
      setPlannerLoading(false)
    }
  }

  function reset() {
    clearInterval(intervalRef.current)
    setScenarioId(null)
    setPhase('idle')
    setTimeline(null)
    setMinuteIndex(0)
    setAlerts([])
    setPlanner(null)
  }

  const current = timeline?.[minuteIndex]

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontFamily: 'var(--font-display)' }}>DIGITAL STADIUM TWIN</h1>
      <p style={{ margin: '0 0 1rem', fontSize: '13px', color: 'var(--text-secondary)' }}>
        Simulate an operational scenario and watch the stadium — and the agents reasoning about it — respond live.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginBottom: '1rem' }}>
        {Object.entries(SCENARIOS).map(([id, s]) => (
          <button
            key={id}
            onClick={() => trigger(id)}
            disabled={phase === 'playing'}
            className="hover-lift card-glass"
            style={{
              border: `1px solid ${scenarioId === id ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'left',
              color: 'var(--floodlight)',
              opacity: phase === 'playing' ? 0.6 : 1,
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
            <div style={{ fontSize: '12px', fontWeight: 600 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {!current && (
        <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
          Pick a scenario above to simulate the next 6 minutes of stadium operations.
        </div>
      )}

      {current && (
        <>
          <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {phase === 'playing' ? 'Simulating…' : 'Simulation complete'} — {SCENARIOS[scenarioId].label}
              </span>
              <span className="scoreboard" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                minute {minuteIndex} / {timeline.length - 1}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {timeline.map((t, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    background: i <= minuteIndex ? healthColor(current.metrics.healthScore) : 'var(--bg-panel-raised)',
                    transition: 'background 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Stadium health score — the headline number */}
          <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Stadium health score
            </p>
            <p className="scoreboard" style={{ margin: 0, fontSize: '42px', fontWeight: 700, color: healthColor(current.metrics.healthScore) }}>
              <AnimatedNumber value={current.metrics.healthScore} />
            </p>
          </div>

          {/* Gate density grid */}
          <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '1.1rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Simulated gate density
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {current.gates.map((g) => (
                <div key={g.id} style={{ background: 'var(--bg-panel-raised)', borderRadius: '10px', padding: '10px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {g.name}{g.closed && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>CLOSED</span>}
                  </p>
                  <p className="scoreboard" style={{ margin: 0, fontSize: '18px' }}>
                    <AnimatedNumber value={g.waitMin} /> <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>min</span>
                  </p>
                  <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', marginTop: '6px', overflow: 'hidden' }}>
                    <div className="progress-bar-fill" style={{ width: `${Math.round(g.density * 100)}%`, height: '100%', background: g.density > 0.75 ? 'var(--danger)' : g.density > 0.45 ? 'var(--amber)' : 'var(--accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational metrics */}
          <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '1.1rem', marginBottom: '1rem' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Operational metrics
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {Object.entries(METRIC_META).map(([key, meta]) => {
                const value = current.metrics[key]
                const color = metricColor(value, meta.invert)
                return (
                  <div key={key} style={{ background: 'var(--bg-panel-raised)', borderRadius: '10px', padding: '10px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-secondary)' }}>{meta.label}</p>
                    <p className="scoreboard" style={{ margin: '0 0 6px', fontSize: '16px', color }}>
                      <AnimatedNumber value={value} />%
                    </p>
                    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div className="progress-bar-fill" style={{ width: `${value}%`, height: '100%', background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Autonomous alerts */}
          {alerts.length > 0 && (
            <div style={{ display: 'grid', gap: '6px', marginBottom: '1rem' }}>
              {alerts.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    background: a.tone === 'danger' ? 'rgba(255,77,109,0.12)' : 'rgba(255,176,32,0.12)',
                    border: `1px solid ${a.tone === 'danger' ? 'rgba(255,77,109,0.4)' : 'rgba(255,176,32,0.4)'}`,
                    color: a.tone === 'danger' ? 'var(--danger)' : 'var(--amber)',
                  }}
                >
                  {a.text}
                </div>
              ))}
            </div>
          )}

          {/* Planner Agent synthesis — appears once playback finishes */}
          {phase === 'done' && (
            <>
              <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '1.1rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Cascading consequences
                </h2>
                {plannerLoading ? (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Planner Agent is synthesizing…</p>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--floodlight)', lineHeight: 1.6 }}>{planner?.narrative}</p>
                )}
              </div>

              {planner?.agentOpinions && (
                <div style={{ marginBottom: '1rem' }}>
                  <AgentsWorkingPanel agentOpinions={planner.agentOpinions} />
                </div>
              )}

              {planner?.actions?.length > 0 && (
                <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '14px', padding: '1.1rem', marginBottom: '1rem' }}>
                  <h2 style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Recommended actions
                  </h2>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {planner.actions.map((a) => (
                      <div key={a.id} style={{ background: 'var(--bg-panel-raised)', borderRadius: '10px', padding: '12px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600 }}>{a.text}</p>
                        <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-secondary)' }}>{a.why}</p>
                        <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>Confidence: <strong style={{ color: 'var(--accent)' }}>{Math.round(a.confidence * 100)}%</strong></span>
                          <span>Recovery: <strong style={{ color: 'var(--accent)' }}>~{a.estimatedRecoveryMin} min</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <button onClick={reset} className="hover-lift" style={{ background: 'var(--bg-panel-raised)', border: '1px solid var(--line-strong)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '10px 16px', fontSize: '12px' }}>
            Reset simulation
          </button>
        </>
      )}
    </div>
  )
}
