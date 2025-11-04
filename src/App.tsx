import { useState, useEffect } from 'react'
import { uuidv7 } from 'uuidv7'
import './App.css'
import { 
  loadGamesFromFile, 
  saveGamesToFile, 
  isFileSystemAccessSupported,
  hasOpenFile
} from './fileStorage'

interface Game {
  id: string
  title: string
  completed: boolean
}

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [inputValue, setInputValue] = useState('')
  const [fileSupported, setFileSupported] = useState(false)

  // Check File System Access API support on mount
  useEffect(() => {
    setFileSupported(isFileSystemAccessSupported())
  }, [])

  // Auto-save games when they change
  useEffect(() => {
    if (hasOpenFile() && games.length >= 0) {
      saveGamesToFile(games)
    }
  }, [games])

  const handleLoadFile = async () => {
    const loadedGames = await loadGamesFromFile()
    if (loadedGames !== null) {
      setGames(loadedGames)
    }
  }

  const handleSaveFile = async () => {
    await saveGamesToFile(games)
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
          games.map(game => (
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
