import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.jsx'

// Renders the entire app — every context provider (session memory, live
// data, agent activity) and the router — the same tree a real user gets.
// This is deliberately an integration test, not a mock: if any provider is
// missing, misconfigured, or a page throws on mount, this fails.
function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('App', () => {
  it('renders Command Center by default with live gate density', () => {
    renderApp()
    expect(screen.getByRole('link', { name: 'Command Center' })).toBeInTheDocument()
    expect(screen.getByText('Live gate density')).toBeInTheDocument()
    expect(screen.getByText('Service wait times')).toBeInTheDocument()
  })

  it('navigates to the Assistant page and shows the chat', () => {
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: 'Assistant' }))
    expect(screen.getByText('ASK STADIUMMIND')).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Where's the nearest accessible restroom?")).toBeInTheDocument()
  })

  it('navigates to the Accessibility page and can run the agent locally', () => {
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: 'Accessibility' }))
    expect(screen.getByText('ACCESSIBILITY')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Plan my accessible route'))
    // The agent runs entirely client-side (no network call), so a
    // recommendation should appear immediately.
    expect(screen.getByText('Recommended entrance:')).toBeInTheDocument()
  })

  it('navigates to the Emergency page and lists all request types', () => {
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: 'Emergency' }))
    expect(screen.getByText('REQUEST ASSISTANCE')).toBeInTheDocument()
    expect(screen.getByLabelText('Medical')).toBeInTheDocument()
    expect(screen.getByLabelText('Lost child')).toBeInTheDocument()
  })

  it('routes "Lost child" into the dedicated recovery workflow instead of the generic form', () => {
    renderApp('/emergency')
    fireEvent.click(screen.getByLabelText('Lost child'))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Lost child details')).toBeInTheDocument()
  })

  it('navigates to the Digital Twin page and can trigger a scenario simulation', () => {
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: 'Digital Twin' }))
    expect(screen.getByText('DIGITAL STADIUM TWIN')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Gate Closure'))
    // The simulation timeline is computed instantly client-side, so the
    // health score and gate density should appear without waiting on a network call.
    expect(screen.getByText('Stadium health score')).toBeInTheDocument()
    expect(screen.getByText('Simulated gate density')).toBeInTheDocument()
  })
})
