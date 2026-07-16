import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { gates as initialGates, services as initialServices, venueContext as initialVenueContext } from '../data/mockData.js'

const LiveDataContext = createContext(null)

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

// Recompute wait/walk minutes from a density value so the two numbers
// never drift out of sync as density changes.
function densityToWait(density) {
  return Math.round(2 + density * 14)
}

export function LiveDataProvider({ children }) {
  const [gates, setGates] = useState(initialGates)
  const [services, setServices] = useState(initialServices)
  const [venue, setVenue] = useState({ ...initialVenueContext, kickoffSeconds: initialVenueContext.minutesToKickoff * 60 })
  const [lostChildAlert, setLostChildAlert] = useState(false)

  // Kickoff countdown — ticks every second.
  useEffect(() => {
    const id = setInterval(() => {
      setVenue((v) => ({ ...v, kickoffSeconds: v.kickoffSeconds > 0 ? v.kickoffSeconds - 1 : 0 }))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Gate density random-walk — ticks every 4 seconds so the venue feels alive.
  useEffect(() => {
    const id = setInterval(() => {
      setGates((prev) =>
        prev.map((g) => {
          if (g.closed) return g
          const delta = (Math.random() - 0.48) * 0.08 // slight upward bias, feels more "event-like"
          const density = clamp(g.density + delta, 0.05, 0.98)
          const trend = density > g.density + 0.01 ? 'rising' : density < g.density - 0.01 ? 'falling' : 'steady'
          return { ...g, density, waitMin: densityToWait(density), densityTrend: trend }
        })
      )
    }, 4000)
    return () => clearInterval(id)
  }, [])

  // Demo controls — lets you trigger scenarios live during a demo instead
  // of waiting for the random walk to happen to produce them.
  const simulateRain = useCallback(() => {
    setVenue((v) => ({ ...v, weather: v.weather === 'rain' ? 'clear' : 'rain' }))
  }, [])

  const closeGate = useCallback((gateId) => {
    setGates((prev) =>
      prev.map((g) => (g.id === gateId ? { ...g, closed: !g.closed, density: g.closed ? 0.3 : 1, waitMin: g.closed ? 3 : 99 } : g))
    )
  }, [])

  const triggerLostChildAlert = useCallback(() => {
    setLostChildAlert(true)
  }, [])

  const dismissLostChildAlert = useCallback(() => {
    setLostChildAlert(false)
  }, [])

  const value = {
    gates,
    services,
    venue,
    lostChildAlert,
    simulateRain,
    closeGate,
    triggerLostChildAlert,
    dismissLostChildAlert,
  }

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>
}

export function useLiveData() {
  const ctx = useContext(LiveDataContext)
  if (!ctx) throw new Error('useLiveData must be used within a LiveDataProvider')
  return ctx
}
