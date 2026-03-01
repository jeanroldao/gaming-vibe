import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnScreenKeyboard } from '../OnScreenKeyboard'

const defaultProps = {
  visible: true,
  onInput: vi.fn(),
  onBackspace: vi.fn(),
  onEnter: vi.fn(),
  onClose: vi.fn(),
}

describe('OnScreenKeyboard', () => {
  it('renders keyboard when visible is true', () => {
    render(<OnScreenKeyboard {...defaultProps} />)
    expect(screen.getByText(/On-Screen Keyboard/i)).toBeInTheDocument()
  })

  it('renders nothing when visible is false', () => {
    render(<OnScreenKeyboard {...defaultProps} visible={false} />)
    expect(screen.queryByText(/On-Screen Keyboard/i)).not.toBeInTheDocument()
  })

  it('calls onInput when a letter key is clicked', async () => {
    const onInput = vi.fn()
    render(<OnScreenKeyboard {...defaultProps} onInput={onInput} />)
    await userEvent.click(screen.getByRole('button', { name: 'A' }))
    expect(onInput).toHaveBeenCalledWith('A')
  })

  it('calls onBackspace when ⌫ is clicked', async () => {
    const onBackspace = vi.fn()
    render(<OnScreenKeyboard {...defaultProps} onBackspace={onBackspace} />)
    await userEvent.click(screen.getByRole('button', { name: '⌫' }))
    expect(onBackspace).toHaveBeenCalled()
  })

  it('calls onEnter when ✓ is clicked', async () => {
    const onEnter = vi.fn()
    render(<OnScreenKeyboard {...defaultProps} onEnter={onEnter} />)
    await userEvent.click(screen.getByRole('button', { name: '✓' }))
    expect(onEnter).toHaveBeenCalled()
  })

  it('calls onClose when Close button is clicked', async () => {
    const onClose = vi.fn()
    render(<OnScreenKeyboard {...defaultProps} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /Close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onInput with a space when Space button is clicked', async () => {
    const onInput = vi.fn()
    render(<OnScreenKeyboard {...defaultProps} onInput={onInput} />)
    await userEvent.click(screen.getByRole('button', { name: /Space/i }))
    expect(onInput).toHaveBeenCalledWith(' ')
  })
})
