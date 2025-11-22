import { useState, useEffect, useRef, useMemo } from 'react'
import { uuidv7 } from 'uuidv7'
import './App.css'
import type { Game } from './types'
import { 
  loadGamesFromFile, 
  saveGamesToFile, 
  isFileSystemAccessSupported,
  hasOpenFile,
  getCurrentFileName,
  loadLastOpenedFile
} from './fileStorage'
import { useGamepad } from './useGamepad'
import { OnScreenKeyboard } from './OnScreenKeyboard'

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [inputValue, setInputValue] = useState('')
  const [fileSupported, setFileSupported] = useState(false)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [hasGamepad, setHasGamepad] = useState(false)
  const saveTimeoutRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sort games to display unfinished games first, finished games last
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => Number(a.completed) - Number(b.completed))
  }, [games])

  // Helper function to update the file name display
  const updateFileNameDisplay = async () => {
    const fileName = await getCurrentFileName()
    setCurrentFileName(fileName)
  }

  // Check File System Access API support on mount
  useEffect(() => {
    const initialize = async () => {
      const supported = isFileSystemAccessSupported()
      setFileSupported(supported)
      
      // Try to load the last opened file automatically
      if (supported) {
        const loadedGames = await loadLastOpenedFile()
        if (loadedGames !== null) {
          setGames(loadedGames)
          await updateFileNameDisplay()
        }
      }
    }
    
    initialize()
  }, [])

  // Check for gamepad connection
  useEffect(() => {
    const checkGamepadConnection = () => {
      const gamepads = navigator.getGamepads()
      const connected = gamepads.some(gp => gp !== null)
      setHasGamepad(connected)
    }

    checkGamepadConnection()
    const interval = setInterval(checkGamepadConnection, 1000)

    window.addEventListener('gamepadconnected', checkGamepadConnection)
    window.addEventListener('gamepaddisconnected', checkGamepadConnection)

    return () => {
      clearInterval(interval)
      window.removeEventListener('gamepadconnected', checkGamepadConnection)
      window.removeEventListener('gamepaddisconnected', checkGamepadConnection)
    }
  }, [])

  // Auto-save games when they change (with debouncing)
  useEffect(() => {
    if (hasOpenFile()) {
      // Clear any existing timeout
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      // Set a new timeout to save after 500ms of inactivity
      saveTimeoutRef.current = window.setTimeout(async () => {
        const success = await saveGamesToFile(games)
        if (success) {
          await updateFileNameDisplay()
        }
      }, 500)
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [games])

  const handleLoadFile = async () => {
    const loadedGames = await loadGamesFromFile()
    if (loadedGames !== null) {
      setGames(loadedGames)
      await updateFileNameDisplay()
    }
  }

  const handleSaveFile = async () => {
    const success = await saveGamesToFile(games)
    if (success) {
      await updateFileNameDisplay()
    }
  }

  const addGame = () => {
    if (inputValue.trim() === '') return
    
    const newGame: Game = {
      id: uuidv7(),
      title: inputValue,
      completed: false
    }
    
    setGames([...games, newGame])
    setInputValue('')
  }

  const toggleGame = (id: string) => {
    setGames(games.map(game => 
      game.id === id ? { ...game, completed: !game.completed } : game
    ))
  }

  const deleteGame = (id: string) => {
    setGames(games.filter(game => game.id !== id))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addGame()
    }
  }

  // Calculate total focusable elements
  const totalElements = useMemo(() => {
    let count = 0
    if (fileSupported) count += 2 // Load and Save buttons
    count += 2 // Input field and Add button
    count += games.length * 2 // Each game has checkbox and delete button
    return count
  }, [fileSupported, games.length])

  // Gamepad navigation
  useGamepad({
    onUp: () => {
      if (!keyboardVisible) {
        setFocusedIndex(prev => Math.max(0, prev - 1))
      }
    },
    onDown: () => {
      if (!keyboardVisible) {
        setFocusedIndex(prev => Math.min(totalElements - 1, prev + 1))
      }
    },
    onA: () => {
      if (!keyboardVisible) {
        // Trigger the focused element's action
        let index = 0
        
        // File buttons
        if (fileSupported) {
          if (index === focusedIndex) {
            handleLoadFile()
            return
          }
          index++
          
          if (index === focusedIndex) {
            handleSaveFile()
            return
          }
          index++
        }
        
        // Input field
        if (index === focusedIndex) {
          setKeyboardVisible(true)
          return
        }
        index++
        
        // Add button
        if (index === focusedIndex) {
          addGame()
          return
        }
        index++
        
        // Game items (checkbox and delete)
        for (const game of sortedGames) {
          if (index === focusedIndex) {
            toggleGame(game.id)
            return
          }
          index++
          
          if (index === focusedIndex) {
            deleteGame(game.id)
            return
          }
          index++
        }
      }
    },
    onB: () => {
      if (keyboardVisible) {
        setKeyboardVisible(false)
      }
    },
    onX: () => {
      // X button to open keyboard when input is focused
      if (!keyboardVisible) {
        const index = fileSupported ? 2 : 0
        if (index === focusedIndex) {
          setKeyboardVisible(true)
        }
      }
    }
  })

  // Focus effect
  useEffect(() => {
    const elements: HTMLElement[] = []
    
    // Gather all focusable elements
    if (fileSupported) {
      const loadBtn = document.querySelector('.file-button:nth-of-type(1)') as HTMLElement
      const saveBtn = document.querySelector('.file-button:nth-of-type(2)') as HTMLElement
      if (loadBtn) elements.push(loadBtn)
      if (saveBtn) elements.push(saveBtn)
    }
    
    if (inputRef.current) elements.push(inputRef.current)
    const addBtn = document.querySelector('.add-button') as HTMLElement
    if (addBtn) elements.push(addBtn)
    
    const gameCheckboxes = document.querySelectorAll('.game-checkbox')
    const deleteButtons = document.querySelectorAll('.delete-button')
    
    sortedGames.forEach((_, i) => {
      if (gameCheckboxes[i]) elements.push(gameCheckboxes[i] as HTMLElement)
      if (deleteButtons[i]) elements.push(deleteButtons[i] as HTMLElement)
    })
    
    // Apply focus styling
    elements.forEach((el, i) => {
      if (i === focusedIndex) {
        el.classList.add('gamepad-focused')
      } else {
        el.classList.remove('gamepad-focused')
      }
    })
  }, [focusedIndex, fileSupported, sortedGames])

  return (
    <div className={`app ${hasGamepad ? 'gamepad-mode' : ''}`}>
      {hasGamepad && (
        <div className="controller-hint">
          🎮 Controller detected! Use D-Pad to navigate, A to select, X to type, B to cancel
        </div>
      )}
      <h1>🎮 Gaming Vibe</h1>
      <p className="subtitle">Manage your game collection</p>
      
      {fileSupported && (
        <div className="file-controls">
          <button onClick={handleLoadFile} className="file-button">
            📂 Open File
          </button>
          <button onClick={handleSaveFile} className="file-button">
            💾 Save As
          </button>
          {currentFileName && (
            <div className="current-file-name">
              📄 {currentFileName}
            </div>
          )}
        </div>
      )}
      
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => hasGamepad && setKeyboardVisible(true)}
          placeholder={hasGamepad ? "Add a new game... (Press X to type)" : "Add a new game..."}
          className="game-input"
        />
        <button onClick={addGame} className="add-button">
          Add Game
        </button>
      </div>

      <div className="games-list">
        {games.length === 0 ? (
          <p className="empty-message">No games yet. Add your first game above!</p>
        ) : (
          sortedGames.map(game => (
            <div key={game.id} className={`game-item ${game.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={game.completed}
                onChange={() => toggleGame(game.id)}
                className="game-checkbox"
              />
              <span className="game-title">{game.title}</span>
              <button onClick={() => deleteGame(game.id)} className="delete-button">
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {games.length > 0 && (
        <div className="stats">
          <p>Total games: {games.length} | Completed: {games.filter(g => g.completed).length}</p>
        </div>
      )}

      <OnScreenKeyboard
        visible={keyboardVisible}
        onInput={(char) => setInputValue(prev => prev + char)}
        onBackspace={() => setInputValue(prev => prev.slice(0, -1))}
        onEnter={() => {
          addGame()
          setKeyboardVisible(false)
        }}
        onClose={() => setKeyboardVisible(false)}
      />
    </div>
  )
}

export default App
