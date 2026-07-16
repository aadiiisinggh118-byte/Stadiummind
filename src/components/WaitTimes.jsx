import { useLiveData } from '../state/LiveDataContext.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'

const trendIcon = { up: '▲', down: '▼', steady: '—' }
const trendColor = { up: 'var(--danger)', down: 'var(--accent)', steady: 'var(--text-muted)' }

export default function WaitTimes() {
  const { services } = useLiveData()
  return (
    <section
      className="card-glass"
      style={{
        border: '1px solid var(--line)',
        borderRadius: '16px',
        padding: '1.25rem',
      }}
      aria-labelledby="wait-times-heading"
    >
      <h2 id="wait-times-heading" style={{ margin: '0 0 1rem', fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Service wait times
      </h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
        {services.map((s) => (
          <li
            key={s.id}
            className="hover-lift"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.7rem 0.9rem',
              background: 'var(--bg-panel-raised)',
              borderRadius: '10px',
            }}
          >
            <span style={{ fontSize: '13px' }}>{s.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="scoreboard" style={{ fontSize: '14px' }}><AnimatedNumber value={s.waitMin} /> min</span>
              <span aria-hidden="true" style={{ color: trendColor[s.trend], fontSize: '11px' }}>{trendIcon[s.trend]}</span>
              <span className="sr-only">trend: {s.trend}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
