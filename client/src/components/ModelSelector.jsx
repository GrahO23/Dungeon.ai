import { useState } from 'react'
import { useGame } from '../state/gameStore.jsx'

export function ModelSelector() {
  const { model, availableModels, selectModel, sessionStatus } = useGame()
  const [error, setError] = useState(null)
  const [switching, setSwitching] = useState(false)
  const locked = sessionStatus !== 'setup'

  async function handleChange(e) {
    const next = e.target.value
    setError(null)
    setSwitching(true)
    try {
      await selectModel(next)
    } catch (err) {
      setError(err.message)
    } finally {
      setSwitching(false)
    }
  }

  if (!availableModels.length) return null

  return (
    <div className="model-selector">
      <label>
        DM model:{' '}
        <select value={model} onChange={handleChange} disabled={switching || locked}>
          {availableModels.map((m) => (
            <option key={m.name} value={m.name}>
              {m.label || m.name}
              {m.parameterSize ? ` (${m.parameterSize})` : ''}
            </option>
          ))}
        </select>
      </label>
      {locked && <span className="settings-hint"> Locked once the game starts.</span>}
      {error && <span className="error"> {error}</span>}
    </div>
  )
}
