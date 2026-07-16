import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

// jsdom doesn't implement matchMedia or scrollTo — components that call them
// (chat auto-scroll, responsive helpers) would otherwise throw in tests.
window.HTMLElement.prototype.scrollTo = () => {}
