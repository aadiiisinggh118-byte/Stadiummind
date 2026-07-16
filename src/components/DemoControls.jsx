import { useState } from 'react'
import { useLiveData } from '../state/LiveDataContext.jsx'

export default function DemoControls() {
  const [open, setOpen] = useState(false)
  const { simulateRain, closeGate, triggerLostChildAlert, venue } = useLiveData()

  return (
    <div style={{ position: 'fixed', bottom: '1rem', left: '1rem', zIndex: 20 }}>
      {open && (
        <div
          className="card-glass"
          style={{
            border: '1px solid var(--line-strong)',
            borderRadius: '12px',
            padding: '10px',
            marginBottom: '8px',
            display: 'grid',
            gap: '6px',
            width: '200px',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Demo controls
          </p>
          <button onClick={simulateRain} style={demoBtnStyle} className="hover-lift">
            {venue.weather === 'rain' ? 'Stop rain' : 'Simulate rain'}
          </button>
          <button onClick={() => closeGate("B")} style={demoBtnStyle} className="hover-lift">
            Toggle Gate B closure
          </button>
          <button onClick={triggerLostChildAlert} style={demoBtnStyle} className="hover-lift">
            Trigger lost-child alert
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'var(--bg-panel-raised)',
          border: '1px solid var(--line-strong)',
          color: 'var(--text-secondary)',
          borderRadius: '999px',
          padding: '8px 14px',
          fontSize: '12px',
        }}
      >
        {open ? 'Close' : 'Demo controls'}
      </button>
    </div>
  )
}

const demoBtnStyle = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--line)',
  color: 'var(--floodlight)',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '12px',
  textAlign: 'left',
}
