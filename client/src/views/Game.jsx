import { useGame } from '../state/gameStore.jsx'
import { TurnBanner } from '../components/TurnBanner.jsx'
import { NarrationLog } from '../components/NarrationLog.jsx'
import { ActionInput } from '../components/ActionInput.jsx'
import { ModelSelector } from '../components/ModelSelector.jsx'
import { CharacterSheet } from '../components/CharacterSheet.jsx'
import { InventoryPanel } from '../components/InventoryPanel.jsx'
import { MapView } from '../components/MapView.jsx'
import { CharacterCard } from '../components/CharacterCard.jsx'
import { SettingsPanel } from '../components/SettingsPanel.jsx'

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
    map,
  } = useGame()

  const currentCharacter = turnOrder[currentTurnIndex]
  const isMyTurn = myCharacter === currentCharacter && !thinking
  const myCharacterSheet = characters.find((c) => c.name === myCharacter)
  const otherCharacters = characters.filter((c) => c.name !== myCharacter)

  return (
    <div className="game">
      <div className="game-header">
        <h1>Dungeon.ai</h1>
        <div className="game-header-actions">
          <button type="button" className="voice-toggle" onClick={toggleVoice} title="Toggle DM voice">
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
          <SettingsPanel />
        </div>
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

      <div className="game-layout">
        <div className="game-main">
          <p className="scene">{currentScene}</p>

          <TurnBanner currentCharacter={currentCharacter} myCharacter={myCharacter} thinking={thinking} />

          <NarrationLog turns={recentTurns} />

          {lastError && <p className="error">{lastError}</p>}

          <ActionInput disabled={!isMyTurn || !myCharacter} onSubmit={sendAction} />
        </div>

        <div className="game-sidebar">
          {myCharacterSheet && (
            <section>
              <h2>Character</h2>
              <CharacterSheet character={myCharacterSheet} />
            </section>
          )}

          {myCharacterSheet && (
            <section>
              <h2>Inventory</h2>
              <InventoryPanel
                inventory={myCharacterSheet.inventory}
                disabled={!isMyTurn}
                onUseItem={(name) => sendAction(`use ${name}`)}
              />
            </section>
          )}

          <section>
            <h2>Map</h2>
            <MapView map={map} />
          </section>

          {otherCharacters.length > 0 && (
            <section>
              <h2>Party</h2>
              <ul className="roster">
                {otherCharacters.map((c) => (
                  <CharacterCard key={c.slug} character={c} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
