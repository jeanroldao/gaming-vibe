import '@testing-library/jest-dom'
import { vi } from 'vitest'
import 'fake-indexeddb/auto'

// Stub Gamepad API which is not available in jsdom
Object.defineProperty(navigator, 'getGamepads', {
  value: vi.fn(() => [null, null, null, null]),
  configurable: true,
  writable: true,
})
