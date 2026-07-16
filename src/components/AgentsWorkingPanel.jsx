const STEP_STYLE = {
  planner: { color: 'var(--accent-purple)', icon: '🧠' },
  navigation: { color: 'var(--accent)', icon: '🧭' },
  accessibility: { color: 'var(--accent)', icon: '♿' },
  crowd: { color: 'var(--amber)', icon: '👥' },
  final: { color: 'var(--accent-purple)', icon: '✅' },
}

function Step({ role, children }) {
  const style = STEP_STYLE[role]
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '6px 0' }}>
      <span style={{ fontSize: '14px', flexShrink: 0 }}>{style.icon}</span>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{children}</div>
    </div>
  )
}

export default function AgentsWorkingPanel({ agentOpinions }) {
  if (!agentOpinions) return null
  const { navResult, accessResult, crowdResult } = agentOpinions

  const navGate = navResult?.recommendation
  const accessGate = accessResult?.recommendation
  const crowdFlag = crowdResult?.shouldReroute ? crowdResult.suggestedGate : null

  const accessDisagrees = accessGate && navGate && accessGate !== navGate
  const crowdDisagrees = crowdFlag && navGate && crowdFlag !== navGate

  return (
    <div
      className="card-glass"
      style={{
        border: '1px solid var(--line)',
        borderRadius: '14px',
        padding: '1rem 1.1rem',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Agents working
      </p>

      <div style={{ display: 'grid', gap: '2px' }}>
        <Step role="planner">
          <strong style={{ color: STEP_STYLE.planner.color }}>Planner Agent</strong> → requests Navigation Agent
        </Step>
        <Step role="navigation">
          <strong style={{ color: STEP_STYLE.navigation.color }}>Navigation Agent</strong> → recommends{' '}
          <strong>{navGate}</strong> ({Math.round((navResult?.confidence || 0) * 100)}% confidence)
        </Step>
        <Step role="accessibility">
          <strong style={{ color: STEP_STYLE.accessibility.color }}>Accessibility Agent</strong> →{' '}
          {accessDisagrees ? (
            <>warns <strong>{navGate}</strong> is worse for step-free access, prefers <strong>{accessGate}</strong></>
          ) : (
            <>agrees, <strong>{navGate}</strong> also has step-free access</>
          )}
        </Step>
        <Step role="crowd">
          <strong style={{ color: STEP_STYLE.crowd.color }}>Crowd Intelligence Agent</strong> →{' '}
          {crowdDisagrees ? (
            <>disagrees, flags rising congestion and suggests <strong>{crowdFlag}</strong> instead</>
          ) : crowdResult?.shouldReroute ? (
            <>flags congestion, but agrees <strong>{navGate}</strong> is still the better option</>
          ) : (
            <>no congestion risk detected — no objection</>
          )}
        </Step>
        <Step role="planner">
          <strong style={{ color: STEP_STYLE.planner.color }}>Planner Agent</strong> → combines all three, weighing live density,
          accessibility, and distance together
        </Step>
        <Step role="final">
          <strong style={{ color: STEP_STYLE.final.color }}>Final decision</strong> → <strong>{navGate}</strong>
          {(accessDisagrees || crowdDisagrees) && ' (with dissent noted above, shown for transparency)'}
        </Step>
      </div>
    </div>
  )
}
