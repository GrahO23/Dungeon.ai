import { useGame } from '../state/gameStore.jsx'
import { TurnBanner } from '../components/TurnBanner.jsx'
import { NarrationLog } from '../components/NarrationLog.jsx'
import { ActionInput } from '../components/ActionInput.jsx'
import { ModelSelector } from '../components/ModelSelector.jsx'
import { CharacterSheet } from '../components/CharacterSheet.jsx'
import { InventoryPanel } from '../components/InventoryPanel.jsx'
import { MapView } from '../components/MapView.jsx'
import { EnemiesPanel } from '../components/EnemiesPanel.jsx'
import { CharacterCard } from '../components/CharacterCard.jsx'
import { SettingsPanel } from '../components/SettingsPanel.jsx'
import { SectionDivider } from '../components/SectionDivider.jsx'

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
    enemies,
    connected,
  } = useGame()

  const currentCharacter = turnOrder[currentTurnIndex]
  const isMyTurn = myCharacter === currentCharacter && !thinking
  const myCharacterSheet = characters.find((c) => c.name === myCharacter)
  const otherCharacters = characters.filter((c) => c.name !== myCharacter)

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
          <button type="button" className="voice-toggle" onClick={toggleVoice} title="Toggle DM voice">
            {voiceEnabled ? '🔊' : '🔇'}
          </button>
          <SettingsPanel />
        </div>
      </div>

      <div className="game">
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
            <div className="scene-banner">
              <p className="scene">{currentScene}</p>
            </div>

            <TurnBanner currentCharacter={currentCharacter} myCharacter={myCharacter} thinking={thinking} />

            <NarrationLog turns={recentTurns} />

            {lastError && <p className="error">{lastError}</p>}

            <ActionInput disabled={!isMyTurn || !myCharacter} onSubmit={sendAction} />
          </div>

          <div className="game-sidebar">
            {myCharacterSheet && (
              <section>
                <h2>Character</h2>
                <SectionDivider />
                <CharacterSheet character={myCharacterSheet} />
                {Object.keys(myCharacterSheet.spellSlots ?? {}).length > 0 && (
                  <button type="button" disabled={!isMyTurn} onClick={() => sendAction('rest')}>
                    Rest
                  </button>
                )}
              </section>
            )}

            {myCharacterSheet && (
              <section>
                <h2>Inventory</h2>
                <SectionDivider />
                <InventoryPanel
                  inventory={myCharacterSheet.inventory}
                  disabled={!isMyTurn}
                  onUseItem={(name) => sendAction(`use ${name}`)}
                />
              </section>
            )}

            <section>
              <h2>Enemies</h2>
              <SectionDivider />
              <EnemiesPanel enemies={enemies} disabled={!isMyTurn} onLoot={(name) => sendAction(`loot ${name}`)} />
            </section>

            <section>
              <h2>Map</h2>
              <SectionDivider />
              <MapView map={map} />
            </section>

            {otherCharacters.length > 0 && (
              <section>
                <h2>Party</h2>
                <SectionDivider />
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
    </div>
  )
}
