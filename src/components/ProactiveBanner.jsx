import { useState } from 'react'
import { useLiveData } from '../state/LiveDataContext.jsx'
import { assessCrowdRisk } from '../lib/agents/crowdAgent.js'

export default function ProactiveBanner() {
  const { gates, venue, lostChildAlert, dismissLostChildAlert } = useLiveData()
  const [dismissed, setDismissed] = useState({})

  const banners = []

  // Crowd risk — reuses the same Crowd Intelligence Agent logic the backend
  // uses, just fed with live client-side data instead of a static snapshot.
  const risk = assessCrowdRisk(undefined, gates)
  if (risk.shouldReroute && risk.suggestedGate) {
    banners.push({
      id: 'crowd',
      tone: 'warn',
      text: `${risk.reason}. Consider ${risk.suggestedGate} instead.`,
    })
  }

  if (venue.kickoffSeconds <= 600 && venue.kickoffSeconds > 0) {
    banners.push({
      id: 'kickoff',
      tone: 'info',
      text: `Kickoff in ${Math.ceil(venue.kickoffSeconds / 60)} min — head to your gate now to avoid the pre-match rush.`,
    })
  }

  if (venue.weather === 'rain') {
    banners.push({
      id: 'rain',
      tone: 'warn',
      text: venue.indoorRouteAvailable
        ? 'Rain detected — an indoor concourse route is available from the main entrance.'
        : 'Rain detected at the venue.',
    })
  }

  if (lostChildAlert) {
    banners.push({
      id: 'lostchild',
      tone: 'danger',
      text: 'Active lost-child alert nearby — exits near Gate C may be temporarily monitored more closely.',
      onDismiss: dismissLostChildAlert,
    })
  }

  const visible = banners.filter((b) => !dismissed[b.id])
  if (visible.length === 0) return null

  const toneStyle = {
    warn: { background: 'rgba(255,176,32,0.12)', border: 'rgba(255,176,32,0.4)', color: 'var(--amber)' },
    info: { background: 'rgba(77,124,255,0.12)', border: 'rgba(77,124,255,0.35)', color: 'var(--accent)' },
    danger: { background: 'rgba(229,72,77,0.12)', border: 'rgba(229,72,77,0.4)', color: 'var(--danger)' },
  }

  return (
    <div style={{ display: 'grid', gap: '8px', marginBottom: '1rem' }} role="status" aria-live="polite">
      {visible.map((b) => (
        <div
          key={b.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            background: toneStyle[b.tone].background,
            border: `1px solid ${toneStyle[b.tone].border}`,
            color: toneStyle[b.tone].color,
          }}
        >
          <span>{b.text}</span>
          <button
            onClick={() => (b.onDismiss ? b.onDismiss() : setDismissed((d) => ({ ...d, [b.id]: true })))}
            aria-label="Dismiss"
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
