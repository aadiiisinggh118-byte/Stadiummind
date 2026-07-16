import { recommendGate } from '../../data/mockData.js'

const URGENCY_BY_TYPE = {
  Medical: 'critical',
  'Lost child': 'critical',
  'Accessibility assistance': 'high',
  Security: 'critical',
  'Lost item': 'low',
  Other: 'medium',
}

export const VALID_INCIDENT_REASONS = Object.keys(URGENCY_BY_TYPE)

// Baseline dispatch time in minutes, scaled by urgency. In production this
// would come from real volunteer positions/availability.
const BASE_ETA_MIN = { critical: 2, high: 4, medium: 6, low: 10 }

/**
 * Turns a raw SOS reason into a structured incident: urgency, ETA, and two
 * distinct instruction sets (what the volunteer should do, what the fan
 * should do while waiting). This is the "workflow, not a button" piece.
 */
export function classifyIncident(reason, note = '') {
  const urgency = URGENCY_BY_TYPE[reason] || 'medium'
  const nearestGate = recommendGate()
  const etaMin = BASE_ETA_MIN[urgency]

  const volunteerInstructions = {
    Medical: 'Dispatch nearest medical-trained volunteer immediately. Alert on-site paramedic team.',
    'Lost child': 'Alert all gate volunteers with description. Begin PA announcement protocol if not found in 5 min.',
    'Accessibility assistance': 'Send nearest mobility-assist volunteer with wheelchair/support equipment if needed.',
    Security: 'Alert security team directly. Do not approach — flag location only.',
    'Lost item': 'Direct fan to nearest lost-and-found desk; log item description.',
    Other: 'Send general-purpose volunteer to assess the situation.',
  }[reason]

  const userInstructions = {
    Medical: 'Stay where you are if safe to do so. Help is on the way.',
    'Lost child': `Stay at your current location so you're easy to find. Nearest staffed point: ${nearestGate.name}.`,
    'Accessibility assistance': 'A volunteer with assistance is heading to you now.',
    Security: 'Move to a safe, visible location if you can. Security has been alerted.',
    'Lost item': `Head to the lost-and-found desk near ${nearestGate.name} when convenient.`,
    Other: 'A volunteer will be with you shortly.',
  }[reason]

  return {
    type: reason,
    urgency,
    etaMin,
    dispatchFrom: nearestGate.name,
    volunteerInstructions,
    userInstructions,
    note: note || null,
  }
}
