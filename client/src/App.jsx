import './App.css'
import { GameProvider, useGame } from './state/gameStore.jsx'
import { Lobby } from './views/Lobby.jsx'
import { Game } from './views/Game.jsx'

function Router() {
  const { sessionStatus } = useGame()
  return sessionStatus === 'playing' ? <Game /> : <Lobby />
}

function App() {
  return (
    <GameProvider>
      <div className="app-shell">
        <Router />
      </div>
    </GameProvider>
  )
}

export default App
