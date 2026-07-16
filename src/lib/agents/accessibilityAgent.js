import { gates as staticGates, services as staticServices } from '../../data/mockData.js'
import { recommendEntrance } from './navigationAgent.js'

/**
 * Accessibility isn't just "pick a gate with a ramp" — it's a small chain of
 * decisions (entrance, then restroom, then seating help) that need to agree
 * with each other. This agent composes that chain into one coherent plan.
 *
 * @param {{ gatesOverride?: Array, servicesOverride?: Array, minutesToKickoffOverride?: number }} opts
 */
export function planAccessibleRoute(opts = {}) {
  const { gatesOverride, servicesOverride, minutesToKickoffOverride } = opts
  const gates = gatesOverride || staticGates
  const services = servicesOverride || staticServices

  const entrance = recommendEntrance({ needsAccessible: true, gatesOverride: gates, minutesToKickoffOverride })
  const gate = gates.find((g) => g.id === entrance.gateId)
  const seatingHelp = services.find((s) => s.id === 'accessible-seating')
  const restroom = services.find((s) => s.id === 'restrooms')

  const steps = [
    `Enter via ${gate.name}${gate.hasElevator ? ' (elevator available)' : gate.hasRamp ? ' (ramp available)' : ''}`,
    `Accessible restroom is roughly ${restroom.waitMin} min wait, near the main concourse`,
    `Request seating assistance on arrival — current wait for a volunteer is ${seatingHelp.waitMin} min`,
  ]

  return {
    entrance: entrance.recommendation,
    reason: entrance.reason,
    confidence: entrance.confidence,
    alternative: entrance.alternative,
    steps,
  }
}
