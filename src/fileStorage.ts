interface Game {
  id: string
  title: string
  completed: boolean
}

// Type definitions for File System Access API
interface FileSystemFileHandle {
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
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
    const file = await handle.getFile()
    const content = await file.text()
    
    if (!content.trim()) {
      return []
    }
    
    const games = JSON.parse(content) as Game[]
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
export const closeFile = (): void => {
  fileHandle = null
}
