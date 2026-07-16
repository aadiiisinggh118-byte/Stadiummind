import { matchInfo } from '../data/mockData.js'
import { useLiveData } from '../state/LiveDataContext.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'

function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MatchHeader() {
  const { venue } = useLiveData()
  const pctFull = Math.round((matchInfo.attendance / matchInfo.capacity) * 100)

  return (
    <div
      className="card-glass"
      style={{
        border: '1px solid var(--line)',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-80px',
          left: '10%',
          width: '360px',
          height: '160px',
          background: 'radial-gradient(ellipse at center, rgba(168,85,247,0.22), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div>
        <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
          {matchInfo.round} · {matchInfo.venue}
        </p>
        <p style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          {matchInfo.teamA} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs</span> {matchInfo.teamB}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <p className="scoreboard" style={{ margin: 0, fontSize: '22px', color: venue.kickoffSeconds < 300 ? 'var(--amber)' : 'var(--floodlight)' }}>
            {formatCountdown(venue.kickoffSeconds)}
          </p>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>to kickoff</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p className="scoreboard" style={{ margin: 0, fontSize: '16px' }}><AnimatedNumber value={pctFull} />%</p>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>capacity</p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '6px 10px',
            borderRadius: '999px',
            background: venue.weather === 'rain' ? 'rgba(255,176,32,0.15)' : 'rgba(77,124,255,0.15)',
            color: venue.weather === 'rain' ? 'var(--amber)' : 'var(--accent)',
          }}
        >
          {venue.weather === 'rain' ? '🌧 Rain' : '☀ Clear'}
        </div>
      </div>
    </div>
  )
}
