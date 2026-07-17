// Simulated real-time feed. In production this would come from turnstile
// sensors, CCTV crowd-analytics, and the venue's ticketing/POS systems.

export const gates = [
  { id: 'A', name: 'Gate A — North', density: 0.35, waitMin: 3, walkMin: 6, hasElevator: true, hasRamp: true, densityTrend: 'steady' },
  { id: 'B', name: 'Gate B — East', density: 0.62, waitMin: 9, walkMin: 4, hasElevator: false, hasRamp: true, densityTrend: 'rising' },
  { id: 'C', name: 'Gate C — South', density: 0.88, waitMin: 14, walkMin: 2, hasElevator: true, hasRamp: false, densityTrend: 'rising' },
  { id: 'D', name: 'Gate D — West', density: 0.28, waitMin: 2, walkMin: 9, hasElevator: true, hasRamp: true, densityTrend: 'falling' },
]

export const services = [
  { id: 'concessions', label: 'Concessions', waitMin: 6, trend: 'steady' },
  { id: 'restrooms', label: 'Restrooms', waitMin: 2, trend: 'down' },
  { id: 'merch', label: 'Merch stand', waitMin: 11, trend: 'up' },
  { id: 'accessible-seating', label: 'Accessible seating help', waitMin: 4, trend: 'steady' },
]

// Venue-wide context an agent might reason over. In production, minutesToKickoff
// would come from the match schedule and weather from a live forecast API.
export const venueContext = {
  minutesToKickoff: 35,
  weather: 'clear', // 'clear' | 'rain'
  indoorRouteAvailable: true,
}

// Fictional match used for the demo header — not affiliated with or
// depicting any real team, league, or trademark.
export const matchInfo = {
  round: 'Final · World Cup 2026',
  teamA: 'Falcons FC',
  teamB: 'Atlas United',
  venue: 'Continental Arena',
  attendance: 82418,
  capacity: 84000,
}

export function densityLevel(d) {
  if (d < 0.45) return { label: 'Clear', tone: 'good' }
  if (d < 0.75) return { label: 'Moderate', tone: 'warn' }
  return { label: 'Congested', tone: 'bad' }
}

// Simple square layout: each gate is adjacent to its two neighbors.
// Used by the Lost Child Agent to expand its search radius outward.
export const gateAdjacency = {
  A: ['B', 'D'],
  B: ['A', 'C'],
  C: ['B', 'D'],
  D: ['A', 'C'],
}

export function recommendGate() {
  const sorted = [...gates].sort((a, b) => a.density - b.density)
  return sorted[0]
}

// Simulated arrival-mode feed. CO2 figures are illustrative estimates for a
// ~10km trip to the venue (rideshare/parking assume solo occupancy), not
// measured real-world data — kept simple and clearly labeled rather than
// presented as scientifically precise, consistent with how the rest of the
// app treats mock data.
export const transportOptions = [
  { id: 'shuttle', label: 'Free venue shuttle', waitMin: 8, delayMin: 0, co2PerPersonKg: 0.6, accessible: true },
  { id: 'publicTransit', label: 'Public transit (metro)', waitMin: 5, delayMin: 0, co2PerPersonKg: 0.5, accessible: true },
  { id: 'rideshare', label: 'Rideshare', waitMin: 12, delayMin: 0, co2PerPersonKg: 4.6, accessible: true },
  { id: 'parking', label: 'Private car / parking', waitMin: 15, delayMin: 0, co2PerPersonKg: 8.9, accessible: true, lotFillPct: 72 },
]

