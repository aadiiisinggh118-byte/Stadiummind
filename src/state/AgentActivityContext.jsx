import { createContext, useContext, useState, useCallback, useRef } from 'react'

const AgentActivityContext = createContext(null)

export function AgentActivityProvider({ children }) {
  const [activities, setActivities] = useState([])
  const idRef = useRef(0)

  const logActivity = useCallback((agent, summary) => {
    idRef.current += 1
    const entry = { id: idRef.current, agent, summary, time: Date.now() }
    setActivities((a) => [...a.slice(-19), entry])
  }, [])

  return (
    <AgentActivityContext.Provider value={{ activities, logActivity }}>
      {children}
    </AgentActivityContext.Provider>
  )
}

export function useAgentActivity() {
  const ctx = useContext(AgentActivityContext)
  if (!ctx) throw new Error('useAgentActivity must be used within an AgentActivityProvider')
  return ctx
}
