import { useGame } from '../state/gameStore.jsx'
import { TurnBanner } from '../components/TurnBanner.jsx'
import { NarrationLog } from '../components/NarrationLog.jsx'
import { ActionInput } from '../components/ActionInput.jsx'
import { ModelSelector } from '../components/ModelSelector.jsx'

export function Game() {
  const {
    turnOrder,
    currentTurnIndex,
    currentScene,
    recentTurns,
    thinking,
    lastError,
    myCharacter,
    characters,
    claimCharacter,
    sendAction,
    voiceEnabled,
    toggleVoice,
  } = useGame()

  const currentCharacter = turnOrder[currentTurnIndex]
  const isMyTurn = myCharacter === currentCharacter && !thinking

  return (
    <div className="game">
      <div className="game-header">
        <h1>Dungeon.ai</h1>
        <button type="button" className="voice-toggle" onClick={toggleVoice} title="Toggle DM voice">
          {voiceEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      <ModelSelector />

      {!myCharacter && (
        <div className="claim-picker">
          <p>Which character are you playing?</p>
          <select defaultValue="" onChange={(e) => e.target.value && claimCharacter(e.target.value)}>
            <option value="" disabled>
              Choose a character…
            </option>
            {characters.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <p className="scene">{currentScene}</p>

      <TurnBanner currentCharacter={currentCharacter} myCharacter={myCharacter} thinking={thinking} />

      <NarrationLog turns={recentTurns} />

      {lastError && <p className="error">{lastError}</p>}

      <ActionInput disabled={!isMyTurn || !myCharacter} onSubmit={sendAction} />
    </div>
  )
}
