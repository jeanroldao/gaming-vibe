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

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [inputValue, setInputValue] = useState('')
  const [fileSupported, setFileSupported] = useState(false)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const saveTimeoutRef = useRef<number | null>(null)

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

  return (
    <div className="app">
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
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Add a new game..."
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
    </div>
  )
}

export default App
