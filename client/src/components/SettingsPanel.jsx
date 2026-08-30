import { useState } from 'react'
import { useGame } from '../state/gameStore.jsx'

export function SettingsPanel() {
  const { voiceEnabled, toggleVoice, availableVoices, voiceId, voiceSpeed, updateVoiceSettings, sessionStatus } =
    useGame()
  const [open, setOpen] = useState(false)
  const locked = sessionStatus !== 'setup'

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
              onChange={(e) => updateVoiceSettings({ voice: e.target.value })}
              disabled={!availableVoices.length || locked}
            >
              {availableVoices.length === 0 && <option value="">(no voices installed)</option>}
              {availableVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id}
                </option>
              ))}
            </select>
          </label>
          {locked && <p className="settings-hint">Voice and speed can only be changed before the game starts.</p>}

          <label className="settings-row">
            Speed: {voiceSpeed.toFixed(2)}x
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={voiceSpeed}
              onChange={(e) => updateVoiceSettings({ speed: Number(e.target.value) })}
              disabled={locked}
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
