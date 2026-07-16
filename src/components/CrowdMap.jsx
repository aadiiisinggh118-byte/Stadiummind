import { densityLevel } from '../data/mockData.js'
import { useLiveData } from '../state/LiveDataContext.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'

const toneColor = {
  good: 'var(--accent)',
  warn: 'var(--amber)',
  bad: 'var(--danger)',
}

export default function CrowdMap() {
  const { gates } = useLiveData()
  return (
    <section
      className="card-glass"
      style={{
        border: '1px solid var(--line)',
        borderRadius: '16px',
        padding: '1.25rem',
      }}
      aria-labelledby="crowd-map-heading"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 id="crowd-map-heading" style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Live gate density
        </h2>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          updated live
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {gates.map((g) => {
          const lvl = densityLevel(g.density)
          return (
            <div
              key={g.id}
              className="hover-lift"
              style={{
                background: 'var(--bg-panel-raised)',
                border: `1px solid ${toneColor[lvl.tone]}33`,
                borderRadius: '14px',
                padding: '1rem',
              }}
            >
              <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {g.name}
                {g.closed && (
                  <span style={{ marginLeft: '6px', color: 'var(--danger)', fontSize: '10px', border: '1px solid var(--danger)', borderRadius: '4px', padding: '1px 4px' }}>
                    CLOSED
                  </span>
                )}
              </p>
              <p className="scoreboard" style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 700, color: 'var(--floodlight)' }}>
                <AnimatedNumber value={g.waitMin} /><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> min</span>
              </p>
              <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.round(g.density * 100)}%`, height: '100%', background: toneColor[lvl.tone] }}
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: toneColor[lvl.tone] }}>{lvl.label}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
