import { useState } from 'react'
import { createCharacter, generateBackstory } from '../api/rest.js'
import { CLASSES, generateRandomName } from '../utils/characterOptions.js'
import { modifier } from '../utils/stats.js'

const STAT_NAMES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

function rollStat() {
  const rolls = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6))
  rolls.sort((a, b) => a - b)
  rolls.shift()
  return rolls.reduce((a, b) => a + b, 0)
}

function rollStats() {
  return Object.fromEntries(STAT_NAMES.map((name) => [name, rollStat()]))
}

export function CharacterForm({ onCreated }) {
  const [name, setName] = useState('')
  const [characterClass, setCharacterClass] = useState('')
  const [backstory, setBackstory] = useState('')
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [generatingBackstory, setGeneratingBackstory] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { character } = await createCharacter({
        name,
        characterClass,
        stats: stats ?? {},
        backstory,
      })
      setName('')
      setCharacterClass('')
      setBackstory('')
      setStats(null)
      onCreated?.(character)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGenerateBackstory() {
    setError(null)
    setGeneratingBackstory(true)
    try {
      const generated = await generateBackstory(name, characterClass)
      setBackstory(generated)
    } catch (err) {
      setError(err.message)
    } finally {
      setGeneratingBackstory(false)
    }
  }

  const canGenerateBackstory = name.trim() && characterClass && !generatingBackstory

  return (
    <form className="character-form" onSubmit={handleSubmit}>
      <h2>Create a Character</h2>

      <label>
        Name
        <div className="input-with-button">
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <button type="button" onClick={() => setName(generateRandomName())}>
            🎲 Roll
          </button>
        </div>
      </label>

      <label>
        Class
        <div className="class-picker">
          {CLASSES.map((c) => (
            <button
              key={c}
              type="button"
              className={`class-pill${characterClass === c ? ' active' : ''}`}
              onClick={() => setCharacterClass(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </label>

      <label>
        Backstory
        <textarea
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
          rows={3}
          placeholder="Where do they come from? What do they want?"
        />
        <button
          type="button"
          className="btn-text"
          onClick={handleGenerateBackstory}
          disabled={!canGenerateBackstory}
          title={!name.trim() || !characterClass ? 'Enter a name and class first' : undefined}
        >
          {generatingBackstory ? 'Generating…' : '✦ Generate backstory'}
        </button>
      </label>

      <div className="stats-row">
        <span>Ability Scores</span>
        <button type="button" onClick={() => setStats(rollStats())}>
          Roll for me
        </button>
        {stats && (
          <ul className="stats-list">
            {STAT_NAMES.map((s) => (
              <li key={s}>
                <span>{s.toUpperCase()}</span>
                <span className="stat-value">{stats[s]}</span>
                <span className="stat-mod">{modifier(stats[s])}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn-primary" disabled={submitting || !name.trim() || !characterClass}>
        {submitting ? 'Creating…' : 'Create Character'}
      </button>
    </form>
  )
}
