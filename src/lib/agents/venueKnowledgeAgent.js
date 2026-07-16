// Ground-truth venue facts. In production this would be a small vector store
// or CMS-backed lookup; here it's explicit so the agent never invents policy.
const FACTS = {
  bagPolicy: 'Only clear bags under 30x30x15cm are allowed. No backpacks.',
  reEntry: 'Re-entry is allowed once per ticket, at the gate you exited from.',
  openingTime: 'Gates open 2 hours before kickoff.',
  parking: 'Accessible parking is at the North lot, adjacent to Gate A.',
  wifi: 'Free venue wifi network: WORLDCUP2026-FREE, no password required.',
  smoking: 'Smoking is only permitted in designated zones outside each gate.',
}

export function lookupVenuePolicy(topic) {
  const key = Object.keys(FACTS).find((k) => k.toLowerCase() === String(topic).toLowerCase())
  return {
    topic,
    answer: key ? FACTS[key] : null,
    found: Boolean(key),
  }
}

export function listPolicyTopics() {
  return Object.keys(FACTS)
}
