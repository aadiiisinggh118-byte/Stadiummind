import { Link } from 'react-router-dom'
import MatchHeader from '../components/MatchHeader.jsx'
import CrowdMap from '../components/CrowdMap.jsx'
import WaitTimes from '../components/WaitTimes.jsx'

export default function Home() {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <MatchHeader />
      <CrowdMap />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <WaitTimes />
        <div
          className="card-glass hover-lift"
          style={{
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Need help fast?
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Medical, accessibility, lost child, or security — get a volunteer dispatched to you directly.
            </p>
          </div>
          <Link
            to="/emergency"
            style={{
              marginTop: '12px',
              display: 'block',
              textAlign: 'center',
              background: 'var(--danger)',
              color: '#04070f',
              borderRadius: '8px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            Request assistance
          </Link>
        </div>
      </div>
    </div>
  )
}
