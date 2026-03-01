import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isFileSystemAccessSupported,
  hasOpenFile,
  closeFile,
} from '../fileStorage'

describe('isFileSystemAccessSupported', () => {
  it('returns true when both File System Access API methods are present', () => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: vi.fn(), configurable: true, writable: true })
    Object.defineProperty(window, 'showSaveFilePicker', { value: vi.fn(), configurable: true, writable: true })
    expect(isFileSystemAccessSupported()).toBe(true)
  })

  it('returns false when File System Access API methods are absent', () => {
    // jsdom does not define showOpenFilePicker or showSaveFilePicker by default
    // Delete them in case a previous test added them
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).showOpenFilePicker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).showSaveFilePicker
    expect(isFileSystemAccessSupported()).toBe(false)
  })
})

describe('hasOpenFile / closeFile', () => {
  beforeEach(async () => {
    await closeFile()
  })

  it('returns false when no file is open', () => {
    expect(hasOpenFile()).toBe(false)
  })

  it('returns false after closeFile is called', async () => {
    await closeFile()
    expect(hasOpenFile()).toBe(false)
  })
})
