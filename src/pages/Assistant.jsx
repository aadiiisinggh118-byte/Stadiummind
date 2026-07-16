import AIAssistant from '../components/AIAssistant.jsx'
import MemoryChips from '../components/MemoryChips.jsx'
import { useLiveData } from '../state/LiveDataContext.jsx'
import { densityLevel } from '../data/mockData.js'

const SUGGESTIONS = [
  'Which gate should I use right now?',
  "Where's the nearest accessible restroom?",
  "What's the bag policy?",
  'I use a wheelchair, what should I do?',
]

export default function Assistant() {
  const { gates } = useLiveData()

  return (
    <div style={{ height: 'calc(100vh - 3rem)', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ margin: '0 0 0.75rem', fontSize: '20px', fontFamily: 'var(--font-display)' }}>ASK STADIUMMIND</h1>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
        <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <AIAssistant />
        </div>

        <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '16px', padding: '1.1rem' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              What StadiumMind remembers
            </h2>
            <MemoryChips />
          </div>

          <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '16px', padding: '1.1rem' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Try asking
            </h2>
            <div style={{ display: 'grid', gap: '6px' }}>
              {SUGGESTIONS.map((s) => (
                <div
                  key={s}
                  className="hover-lift"
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-panel-raised)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="card-glass" style={{ border: '1px solid var(--line)', borderRadius: '16px', padding: '1.1rem' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Gate snapshot
            </h2>
            <div style={{ display: 'grid', gap: '6px' }}>
              {gates.map((g) => {
                const lvl = densityLevel(g.density)
                const color = lvl.tone === 'good' ? 'var(--accent)' : lvl.tone === 'warn' ? 'var(--amber)' : 'var(--danger)'
                return (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{g.name}</span>
                    <span style={{ color }} className="scoreboard">{g.waitMin} min</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
