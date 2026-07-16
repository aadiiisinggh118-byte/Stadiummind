const AGENT_META = {
  recommend_entrance: { label: 'Navigation Agent', icon: '🧭' },
  plan_accessible_route: { label: 'Accessibility Agent', icon: '♿' },
  assess_crowd_risk: { label: 'Crowd Intelligence Agent', icon: '👥' },
}

/**
 * Looks at a turn's reasoning trace for two agents that independently
 * proposed a gate. If they agree, there's nothing to show — the answer
 * already reflects consensus. If they genuinely differ, that disagreement
 * is real (Navigation/Accessibility already factor in live density when
 * picking a gate; Crowd Intelligence's suggestion is a simpler "lowest
 * density right now" check, so the two can legitimately diverge).
 */
export function extractDebate(reasoning = []) {
  const navEntry = reasoning.find((r) => r.agent === 'recommend_entrance' || r.agent === 'plan_accessible_route')
  const crowdEntry = reasoning.find((r) => r.agent === 'assess_crowd_risk' && r.output?.shouldReroute)
  if (!navEntry || !crowdEntry) return null

  const navGate = navEntry.output.recommendation || navEntry.output.entrance
  const crowdGate = crowdEntry.output.suggestedGate
  if (!navGate || !crowdGate || navGate === crowdGate) return null

  return { navEntry, crowdEntry, navGate, crowdGate }
}

export default function AgentDebate({ reasoning }) {
  const debate = extractDebate(reasoning)
  if (!debate) return null

  const { navEntry, crowdEntry, navGate, crowdGate } = debate
  const navMeta = AGENT_META[navEntry.agent]

  return (
    <div
      style={{
        marginTop: '6px',
        background: 'var(--bg-panel-raised)',
        border: '1px solid var(--line-strong)',
        borderRadius: '10px',
        padding: '10px 12px',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Agents compared notes
      </p>

      <div style={{ display: 'grid', gap: '6px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span>{navMeta.icon} {navMeta.label} proposes</span>
          <strong style={{ color: 'var(--accent)' }}>{navGate}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span>👥 Crowd Intelligence Agent flags</span>
          <strong style={{ color: 'var(--amber)' }}>{crowdGate}</strong>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
        <strong style={{ color: 'var(--accent)' }}>Consensus: {navGate}.</strong> {navMeta.label} already weighs live
        crowd density as one factor alongside distance and accessibility, so its recommendation takes priority —
        Crowd Intelligence's flag is shown for transparency, not overridden silently.
      </p>
    </div>
  )
}
