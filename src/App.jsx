import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import ProactiveBanner from './components/ProactiveBanner.jsx'
import DemoControls from './components/DemoControls.jsx'
import AgentActivityToasts from './components/AgentActivityToasts.jsx'
import { LiveDataProvider } from './state/LiveDataContext.jsx'
import { SessionProvider } from './state/SessionContext.jsx'
import { AgentActivityProvider } from './state/AgentActivityContext.jsx'
import Home from './pages/Home.jsx'
import Assistant from './pages/Assistant.jsx'
import Accessibility from './pages/Accessibility.jsx'
import Emergency from './pages/Emergency.jsx'
import DigitalTwin from './pages/DigitalTwin.jsx'

export default function App() {
  return (
    <AgentActivityProvider>
      <SessionProvider>
        <LiveDataProvider>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <NavBar />
            <main
              style={{
                flex: 1,
                padding: '1.5rem',
                minWidth: 0,
                backgroundImage:
                  'radial-gradient(circle, rgba(130,150,255,0.06) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            >
              <ProactiveBanner />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/accessibility" element={<Accessibility />} />
                <Route path="/emergency" element={<Emergency />} />
                <Route path="/digital-twin" element={<DigitalTwin />} />
              </Routes>
            </main>
            <DemoControls />
            <AgentActivityToasts />
          </div>
        </LiveDataProvider>
      </SessionProvider>
    </AgentActivityProvider>
  )
}
