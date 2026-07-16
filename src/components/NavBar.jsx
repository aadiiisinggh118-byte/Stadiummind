import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Command Center', end: true },
  { to: '/assistant', label: 'Assistant' },
  { to: '/accessibility', label: 'Accessibility' },
  { to: '/emergency', label: 'Emergency' },
  { to: '/digital-twin', label: 'Digital Twin' },
]

export default function NavBar() {
  return (
    <nav
      className="card-glass"
      style={{
        width: '220px',
        flexShrink: 0,
        borderRight: '1px solid var(--line)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      <div style={{ padding: '0 0.5rem 1.5rem' }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '-0.01em' }}>
          STADIUM<span style={{ color: 'var(--accent)' }}>MIND</span>
        </p>
      </div>

      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          style={({ isActive }) => ({
            display: 'block',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            color: isActive ? 'var(--bg-night)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent)' : 'transparent',
            textDecoration: 'none',
          })}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
