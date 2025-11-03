import { useState } from 'react'
import './App.css'

interface Game {
  id: number
  title: string
  completed: boolean
}

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [inputValue, setInputValue] = useState('')

  const addGame = () => {
    if (inputValue.trim() === '') return
    
    const newGame: Game = {
      id: Date.now(),
      title: inputValue,
      completed: false
    }
    
    setGames([...games, newGame])
    setInputValue('')
  }

  const toggleGame = (id: number) => {
    setGames(games.map(game => 
      game.id === id ? { ...game, completed: !game.completed } : game
    ))
  }

  const deleteGame = (id: number) => {
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
