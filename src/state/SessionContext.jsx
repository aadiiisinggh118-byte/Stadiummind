import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SessionContext = createContext(null)
const STORAGE_KEY = 'stadiummind.session'

const LABELS = {
  seatBlock: 'Seat block',
  accessibilityNeed: 'Accessibility need',
  language: 'Language',
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function SessionProvider({ children }) {
  const [memory, setMemory] = useState(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory))
    } catch {
      // Storage unavailable — memory just won't survive a refresh, non-fatal.
    }
  }, [memory])

  const remember = useCallback((key, value) => {
    if (!key || !value) return
    setMemory((m) => ({ ...m, [key]: value }))
  }, [])

  const forget = useCallback((key) => {
    setMemory((m) => {
      const next = { ...m }
      delete next[key]
      return next
    })
  }, [])

  const clearAll = useCallback(() => setMemory({}), [])

  return (
    <SessionContext.Provider value={{ memory, remember, forget, clearAll, labels: LABELS }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
