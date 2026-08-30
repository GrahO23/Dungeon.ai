import { useEffect, useState } from 'react'
import { useGame } from '../state/gameStore.jsx'
import { CharacterForm } from '../components/CharacterForm.jsx'
import { CharacterCard } from '../components/CharacterCard.jsx'
import { ModelSelector } from '../components/ModelSelector.jsx'
import { StartingProgress } from '../components/StartingProgress.jsx'
import { SettingsPanel } from '../components/SettingsPanel.jsx'
import { startGame, getScenarios, startScenario } from '../api/rest.js'

export function Lobby() {
  const { characters, connected, starting, lastError, claimCharacter } = useGame()
  const [error, setError] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState('')

  useEffect(() => {
    getScenarios()
      .then(({ scenarios }) => setScenarios(scenarios))
      .catch((err) => console.warn('Failed to load scenarios:', err))
  }, [])

  async function handleStart() {
    setError(null)
    try {
      await startGame()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleStartScenario() {
    setError(null)
    try {
      await startScenario(selectedScenario)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1>Dungeon.ai</h1>
        <SettingsPanel />
      </div>
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

          {scenarios.length > 0 && (
            <div className="scenario-picker">
              <h2>Or start a pre-built scenario</h2>
              <select value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)}>
                <option value="">Choose a scenario…</option>
                {scenarios.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.title} ({s.difficulty})
                  </option>
                ))}
              </select>
              {selectedScenario && (
                <p className="scenario-description">
                  {scenarios.find((s) => s.slug === selectedScenario)?.description}
                </p>
              )}
              <button
                className="start-game"
                disabled={characters.length === 0 || !selectedScenario}
                onClick={handleStartScenario}
              >
                Start Scenario
              </button>
            </div>
          )}

          <button className="start-game" disabled={characters.length === 0} onClick={handleStart}>
            Start Game
          </button>
        </>
      )}
    </div>
  )
}
