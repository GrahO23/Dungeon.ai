import { useEffect, useState } from 'react'
import { useGame } from '../state/gameStore.jsx'
import { CharacterForm } from '../components/CharacterForm.jsx'
import { CharacterCard } from '../components/CharacterCard.jsx'
import { ModelSelector } from '../components/ModelSelector.jsx'
import { StartingProgress } from '../components/StartingProgress.jsx'
import { SettingsPanel } from '../components/SettingsPanel.jsx'
import { SectionDivider } from '../components/SectionDivider.jsx'
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
    <div className="app-shell-inner">
      <div className="app-header">
        <div className="app-logo">
          <span className="app-logo-mark">D</span>
          <span className="app-logo-word">
            Dungeon<span>.ai</span>
          </span>
        </div>
        <div className="app-header-actions">
          <span className="conn-status">
            <span className="conn-dot" style={{ background: connected ? '#6b7a4a' : '#a89a86' }} />
            {connected ? 'Connected' : 'Connecting…'}
          </span>
          <SettingsPanel />
        </div>
      </div>

      <div className="lobby">
        <div className="lobby-intro">
          <h1>Gather Your Party</h1>
          <p>Create a character, then choose an adventure to begin.</p>
        </div>

        <ModelSelector />

        <section>
          <h2>The Party — {characters.length}</h2>
          <SectionDivider />
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
                <h2>Choose an Adventure</h2>
                <p>Pick a pre-built scenario, or let the DM improvise a world from scratch.</p>
                <SectionDivider />
                <div className="scenario-list">
                  {scenarios.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      className={`scenario-option${selectedScenario === s.slug ? ' active' : ''}`}
                      onClick={() => setSelectedScenario(s.slug)}
                    >
                      <div>
                        <div className="scenario-option-title">{s.title}</div>
                        <div className="scenario-option-description">{s.description}</div>
                      </div>
                      <span className="scenario-option-difficulty">{s.difficulty}</span>
                    </button>
                  ))}
                </div>
                <button
                  className="start-game btn-primary"
                  disabled={characters.length === 0 || !selectedScenario}
                  onClick={handleStartScenario}
                >
                  Start Scenario
                </button>
              </div>
            )}

            <button className="start-game" disabled={characters.length === 0} onClick={handleStart}>
              Start Improvised Game
            </button>
          </>
        )}
      </div>
    </div>
  )
}
