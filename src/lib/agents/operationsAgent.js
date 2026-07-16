import { services as staticServices } from '../../data/mockData.js'

/**
 * Reports current wait time(s) for one or all venue services. This closes a
 * real gap: without this tool, a plain "where's the nearest restroom?"
 * question had no data source at all, and the model would ask the fan for
 * their location instead of just answering — even though the wait time
 * doesn't actually depend on location for a single-concourse venue.
 *
 * @param {string} [serviceId] - one of the service ids, or omit for all
 * @param {Array} [servicesOverride] - pass live data from the frontend
 */
export function checkServiceWait(serviceId, servicesOverride) {
  const services = servicesOverride || staticServices

  if (!serviceId) {
    return { services: services.map((s) => ({ label: s.label, waitMin: s.waitMin, trend: s.trend })) }
  }

  const match = services.find((s) => s.id === serviceId)
  if (!match) {
    return { found: false, requested: serviceId }
  }
  return { found: true, label: match.label, waitMin: match.waitMin, trend: match.trend }
}
