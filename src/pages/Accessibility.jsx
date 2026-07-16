import { useState } from 'react'
import { planAccessibleRoute } from '../lib/agents/accessibilityAgent.js'
import { useLiveData } from '../state/LiveDataContext.jsx'
import { useSession } from '../state/SessionContext.jsx'
import { useAgentActivity } from '../state/AgentActivityContext.jsx'
import { densityLevel } from '../data/mockData.js'

export default function Accessibility() {
  const { gates, services, venue } = useLiveData()
  const { memory, remember, forget } = useSession()
  const { logActivity } = useAgentActivity()
  const [plan, setPlan] = useState(null)

  const remembered = memory.accessibilityNeed === 'Wheelchair/mobility assistance'

  function runPlan() {
    const minutesToKickoff = Math.ceil(venue.kickoffSeconds / 60)
    const result = planAccessibleRoute({ gatesOverride: gates, servicesOverride: services, minutesToKickoffOverride: minutesToKickoff })
    setPlan(result)
    logActivity('Accessibility Agent', `Planned accessible route via ${result.entrance}`)
  }

  function toggleRemember() {
    if (remembered) forget('accessibilityNeed')
    else remember('accessibilityNeed', 'Wheelchair/mobility assistance')
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 1rem', fontSize: '20px', fontFamily: 'var(--font-display)' }}>ACCESSIBILITY</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1rem', alignItems: 'start' }}>
        <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '16px', padding: '1.5rem' }}>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            The Accessibility Agent chains three decisions into one plan: which entrance has
            step-free access right now, where the nearest accessible restroom is, and the
            current wait for a seating-assistance volunteer.
          </p>

          <button
            onClick={runPlan}
            className="hover-lift"
            style={{
              width: '100%',
              background: 'var(--accent)',
              border: 'none',
              color: '#04070f',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '14px',
              marginBottom: '12px',
            }}
          >
            Plan my accessible route
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: plan ? '20px' : 0 }}>
            <input type="checkbox" checked={remembered} onChange={toggleRemember} />
            Remember I need accessibility assistance for the rest of my visit
          </label>

          {plan && (
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <div style={{ background: 'var(--bg-panel-raised)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '13px' }}>
                  <strong style={{ color: 'var(--accent)' }}>Recommended entrance:</strong> {plan.entrance}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--accent)' }}>Why:</strong> {plan.reason}
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--accent)' }}>Confidence:</strong> {Math.round(plan.confidence * 100)}%
                </p>
                {plan.alternative && (
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--accent)' }}>Alternative:</strong> {plan.alternative}
                  </p>
                )}
              </div>

              <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step-by-step
              </p>
              <ol style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '6px' }}>
                {plan.steps.map((step, i) => (
                  <li key={i} style={{ fontSize: '13px', color: 'var(--floodlight)' }}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '16px', padding: '1.25rem' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Gate accessibility overview
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {gates.map((g) => {
              const lvl = densityLevel(g.density)
              const color = lvl.tone === 'good' ? 'var(--accent)' : lvl.tone === 'warn' ? 'var(--amber)' : 'var(--danger)'
              return (
                <div key={g.id} className="hover-lift" style={{ background: 'var(--bg-panel-raised)', borderRadius: '10px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px' }}>{g.name}</span>
                    <span className="scoreboard" style={{ fontSize: '12px', color }}>{g.waitMin} min</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{g.hasElevator ? '✓ Elevator' : '✕ No elevator'}</span>
                    <span>{g.hasRamp ? '✓ Ramp' : '✕ No ramp'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
