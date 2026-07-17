import { transportOptions } from '../data/mockData.js'
import { recommendTransportMode, computeSustainabilitySummary } from '../lib/agents/transportationAgent.js'

export default function GettingHere() {
  const recommendation = recommendTransportMode()
  const sustainability = computeSustainabilitySummary()

  return (
    <section
      className="card-glass"
      style={{ border: '1px solid var(--line)', borderRadius: '16px', padding: '1.25rem' }}
      aria-labelledby="getting-here-heading"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
        <h2 id="getting-here-heading" style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Getting here
        </h2>
        <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'rgba(77,124,255,0.12)', border: '1px solid rgba(77,124,255,0.3)', borderRadius: '999px', padding: '3px 10px' }}>
          Recommended: {recommendation.recommendation}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '10px' }}>
        {transportOptions.map((o) => (
          <div
            key={o.id}
            className="hover-lift"
            style={{
              background: 'var(--bg-panel-raised)',
              border: o.id === recommendation.modeId ? '1px solid var(--accent)' : '1px solid transparent',
              borderRadius: '10px',
              padding: '10px',
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-secondary)' }}>{o.label}</p>
            <p className="scoreboard" style={{ margin: 0, fontSize: '16px' }}>{o.waitMin + o.delayMin} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>min</span></p>
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--text-muted)' }}>{o.co2PerPersonKg} kg CO2/person</p>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {recommendation.reason}.{' '}
        {sustainability && <span style={{ color: 'var(--accent)' }}>{sustainability.summary}</span>}
      </p>
    </section>
  )
}