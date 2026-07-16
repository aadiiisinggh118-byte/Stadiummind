import { useEffect, useRef, useState } from 'react'
import { useAgentActivity } from '../state/AgentActivityContext.jsx'

const AGENT_ICON = {
  'Navigation Agent': '🧭',
  'Crowd Intelligence Agent': '👥',
  'Accessibility Agent': '♿',
  'Venue Knowledge Agent': '📋',
  'Operations Agent': '⏱',
  'Lost Child Agent': '🔍',
  Memory: '🧠',
}

export default function AgentActivityToasts() {
  const { activities } = useAgentActivity()
  const [visible, setVisible] = useState([])
  const lastIdRef = useRef(0)
  const timersRef = useRef({})

  useEffect(() => {
    const fresh = activities.filter((a) => a.id > lastIdRef.current)
    if (fresh.length === 0) return
    lastIdRef.current = activities[activities.length - 1].id
    setVisible((v) => [...v, ...fresh].slice(-4))
    fresh.forEach((entry) => {
      timersRef.current[entry.id] = setTimeout(() => {
        setVisible((v) => v.filter((e) => e.id !== entry.id))
      }, 6000)
    })
  }, [activities])

  useEffect(
    () => () => {
      Object.values(timersRef.current).forEach(clearTimeout)
    },
    []
  )

  if (visible.length === 0) return null

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 30, display: 'grid', gap: '8px', maxWidth: '280px' }}>
      {visible.map((entry) => (
        <div
          key={entry.id}
          style={{
            background: 'var(--bg-panel-raised)',
            border: '1px solid var(--line-strong)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            animation: 'agentToastIn 0.25s ease-out',
          }}
        >
          <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '2px' }}>
            {AGENT_ICON[entry.agent] || '⚙'} {entry.agent}
          </strong>
          {entry.summary}
        </div>
      ))}
      <style>{`
        @keyframes agentToastIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
