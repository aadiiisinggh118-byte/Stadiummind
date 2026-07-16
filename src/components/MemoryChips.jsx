import { useSession } from '../state/SessionContext.jsx'

export default function MemoryChips() {
  const { memory, forget, labels } = useSession()
  const entries = Object.entries(memory)

  if (entries.length === 0) {
    return (
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
        StadiumMind doesn't know anything about you yet — mention your seat block, accessibility
        needs, or language preference and it'll remember for the rest of your visit.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem' }}>
      {entries.map(([key, value]) => (
        <span
          key={key}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '999px',
            background: 'var(--bg-panel-raised)',
            border: '1px solid var(--line-strong)',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--accent)', fontWeight: 600 }}>{labels[key] || key}:</strong> {value}
          <button
            onClick={() => forget(key)}
            aria-label={`Forget ${labels[key] || key}`}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', lineHeight: 1, padding: 0 }}
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  )
}
