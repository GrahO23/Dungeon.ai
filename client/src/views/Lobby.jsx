import { useState } from 'react'
import { useGame } from '../state/gameStore.jsx'
import { CharacterForm } from '../components/CharacterForm.jsx'
import { CharacterCard } from '../components/CharacterCard.jsx'
import { ModelSelector } from '../components/ModelSelector.jsx'
import { StartingProgress } from '../components/StartingProgress.jsx'
import { startGame } from '../api/rest.js'

export function Lobby() {
  const { characters, connected, starting, lastError, claimCharacter } = useGame()
  const [error, setError] = useState(null)

  async function handleStart() {
    setError(null)
    try {
      await startGame()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="lobby">
      <h1>Dungeon.ai</h1>
      <p className="conn-status">{connected ? 'Connected' : 'Connecting…'}</p>
      <ModelSelector />

      <section>
        <h2>Party ({characters.length})</h2>
        <ul className="roster">
          {characters.map((c) => (
            <CharacterCard key={c.slug} character={c} />
          ))}
        </ul>
      </section>

      {starting ? (
        <StartingProgress />
      ) : (
        <>
          <CharacterForm onCreated={(character) => claimCharacter(character.name)} />

          {(error || lastError) && <p className="error">{error || lastError}</p>}

          <button className="start-game" disabled={characters.length === 0} onClick={handleStart}>
            Start Game
          </button>
        </>
      )}
    </div>
  )
}
