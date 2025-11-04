import type { Game } from './types'

// Type definitions for File System Access API
interface FileSystemFileHandle {
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
  queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>
  requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<'granted' | 'denied' | 'prompt'>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
}

interface ShowOpenFilePickerOptions {
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  multiple?: boolean
}

interface ShowSaveFilePickerOptions {
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  suggestedName?: string
}

declare global {
  interface Window {
    showOpenFilePicker?(options?: ShowOpenFilePickerOptions): Promise<FileSystemFileHandle[]>
    showSaveFilePicker?(options?: ShowSaveFilePickerOptions): Promise<FileSystemFileHandle>
  }
}

let fileHandle: FileSystemFileHandle | null = null

const FILE_OPTIONS = {
  types: [{
    description: 'JSON Files',
    accept: { 'application/json': ['.json'] }
  }]
}

const DB_NAME = 'gaming-vibe-db'
const DB_VERSION = 1
const STORE_NAME = 'fileHandles'
const FILE_HANDLE_KEY = 'lastFileHandle'

/**
 * Open IndexedDB database
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * Save file handle to IndexedDB
 */
const saveFileHandleToDB = async (handle: FileSystemFileHandle): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.put(handle, FILE_HANDLE_KEY)
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error saving file handle to IndexedDB:', error)
  }
}

/**
 * Load file handle from IndexedDB
 */
const loadFileHandleFromDB = async (): Promise<FileSystemFileHandle | null> => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(FILE_HANDLE_KEY)
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Error loading file handle from IndexedDB:', error)
    return null
  }
}

/**
 * Clear file handle from IndexedDB
 */
const clearFileHandleFromDB = async (): Promise<void> => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    store.delete(FILE_HANDLE_KEY)
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Error clearing file handle from IndexedDB:', error)
  }
}

/**
 * Check if File System Access API is supported
 */
export const isFileSystemAccessSupported = (): boolean => {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

/**
 * Open a file picker and load games data
 */
export const loadGamesFromFile = async (): Promise<Game[] | null> => {
  if (!isFileSystemAccessSupported()) {
    console.error('File System Access API is not supported in this browser')
    return null
  }

  try {
    const [handle] = await window.showOpenFilePicker!({
      ...FILE_OPTIONS,
      multiple: false
    })
    
    fileHandle = handle
    await saveFileHandleToDB(handle)
    const file = await handle.getFile()
    const content = await file.text()
    
    if (!content.trim()) {
      return []
    }
    
    const parsed = JSON.parse(content)
    
    // Validate that the parsed data is an array of games
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid file format: expected an array of games')
    }
    
    // Validate each game object has the required properties
    const games = parsed.filter((item): item is Game => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.completed === 'boolean'
      )
    })
    
    if (games.length !== parsed.length) {
      console.warn('Some items in the file were invalid and were filtered out')
    }
    
    return games
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled the picker
      return null
    }
    console.error('Error loading games from file:', error)
    return null
  }
}

/**
 * Save games data to the current file handle or prompt for a new file
 */
export const saveGamesToFile = async (games: Game[]): Promise<boolean> => {
  if (!isFileSystemAccessSupported()) {
    console.error('File System Access API is not supported in this browser')
    return false
  }

  try {
    // If no file handle exists, prompt user to create a new file
    if (!fileHandle) {
      fileHandle = await window.showSaveFilePicker!({
        ...FILE_OPTIONS,
        suggestedName: 'games.json'
      })
      await saveFileHandleToDB(fileHandle)
    }

    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify(games, null, 2))
    await writable.close()
    
    return true
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled the picker
      return false
    }
    console.error('Error saving games to file:', error)
    return false
  }
}

/**
 * Create a new file for saving games
 */
export const createNewFile = async (): Promise<boolean> => {
  if (!isFileSystemAccessSupported()) {
    console.error('File System Access API is not supported in this browser')
    return false
  }

  try {
    fileHandle = await window.showSaveFilePicker!({
      ...FILE_OPTIONS,
      suggestedName: 'games.json'
    })
    await saveFileHandleToDB(fileHandle)
    return true
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled the picker
      return false
    }
    console.error('Error creating new file:', error)
    return false
  }
}

/**
 * Check if a file is currently opened
 */
export const hasOpenFile = (): boolean => {
  return fileHandle !== null
}

/**
 * Reset the file handle (close the current file)
 */
export const closeFile = async (): Promise<void> => {
  fileHandle = null
  await clearFileHandleFromDB()
}

/**
 * Get the name of the currently open file
 */
export const getCurrentFileName = async (): Promise<string | null> => {
  if (!fileHandle) {
    return null
  }
  
  try {
    const file = await fileHandle.getFile()
    return file.name
  } catch (error) {
    console.error('Error getting file name:', error)
    return null
  }
}

/**
 * Attempt to load the last opened file automatically
 * Returns the loaded games if successful, null otherwise
 */
export const loadLastOpenedFile = async (): Promise<Game[] | null> => {
  if (!isFileSystemAccessSupported()) {
    return null
  }

  try {
    const handle = await loadFileHandleFromDB()
    if (!handle) {
      return null
    }

    // Verify we still have permission to access the file
    const permission = await handle.queryPermission({ mode: 'readwrite' })
    if (permission !== 'granted') {
      // Try to request permission
      const newPermission = await handle.requestPermission({ mode: 'readwrite' })
      if (newPermission !== 'granted') {
        // Permission denied, clear the stored handle
        await clearFileHandleFromDB()
        return null
      }
    }

    // We have permission, load the file
    fileHandle = handle
    const file = await handle.getFile()
    const content = await file.text()
    
    if (!content.trim()) {
      return []
    }
    
    const parsed = JSON.parse(content)
    
    // Validate that the parsed data is an array of games
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid file format: expected an array of games')
    }
    
    // Validate each game object has the required properties
    const games = parsed.filter((item): item is Game => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.completed === 'boolean'
      )
    })
    
    if (games.length !== parsed.length) {
      console.warn('Some items in the file were invalid and were filtered out')
    }
    
    return games
  } catch (error) {
    console.error('Error loading last opened file:', error)
    // Clear the stored handle if there was an error
    await clearFileHandleFromDB()
    return null
  }
}
