import { useState } from 'react'
import { useGame } from '../state/gameStore.jsx'

export function SettingsPanel() {
  const { voiceEnabled, toggleVoice, availableVoices, voiceId, voiceSpeed, setVoiceId, setVoiceSpeed } = useGame()
  const [open, setOpen] = useState(false)

  return (
    <div className="settings-panel-wrapper">
      <button type="button" className="settings-toggle" onClick={() => setOpen((o) => !o)} title="Voice settings">
        ⚙️
      </button>
      {open && (
        <div className="settings-panel">
          <h3>Voice Settings</h3>

          <label className="settings-checkbox-row">
            <input type="checkbox" checked={voiceEnabled} onChange={toggleVoice} />
            DM voice enabled
          </label>

          <label className="settings-row">
            Voice
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              disabled={!availableVoices.length}
            >
              {availableVoices.length === 0 && <option value="">(no voices installed)</option>}
              {availableVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-row">
            Speed: {voiceSpeed.toFixed(2)}x
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(Number(e.target.value))}
            />
          </label>

          {availableVoices.length === 0 && (
            <p className="settings-hint">
              No TTS voices found on the server. See the README for how to install more.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
