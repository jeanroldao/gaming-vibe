import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// Mock file storage so tests don't require browser File System Access API
vi.mock('../fileStorage', () => ({
  isFileSystemAccessSupported: vi.fn(() => false),
  hasOpenFile: vi.fn(() => false),
  loadLastOpenedFile: vi.fn(() => Promise.resolve(null)),
  loadGamesFromFile: vi.fn(() => Promise.resolve(null)),
  saveGamesToFile: vi.fn(() => Promise.resolve(true)),
  getCurrentFileName: vi.fn(() => Promise.resolve(null)),
}))

// Provide minimal navigator.getGamepads stub
vi.stubGlobal('navigator', {
  ...navigator,
  getGamepads: () => [null, null, null, null],
})

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText(/Gaming Vibe/i)).toBeInTheDocument()
  })

  it('renders the add game input', () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/Add a new game/i)).toBeInTheDocument()
  })

  it('renders the Add Game button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Add Game/i })).toBeInTheDocument()
  })

  it('shows empty state message when there are no games', () => {
    render(<App />)
    expect(screen.getByText(/No games yet/i)).toBeInTheDocument()
  })
})
