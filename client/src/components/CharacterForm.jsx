import { useState } from 'react'
import { createCharacter } from '../api/rest.js'

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

  return (
    <form className="character-form" onSubmit={handleSubmit}>
      <h2>Create a Character</h2>

      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label>
        Class
        <input
          value={characterClass}
          onChange={(e) => setCharacterClass(e.target.value)}
          placeholder="Ranger, Wizard, ..."
        />
      </label>

      <label>
        Backstory
        <textarea value={backstory} onChange={(e) => setBackstory(e.target.value)} rows={3} />
      </label>

      <div className="stats-row">
        <button type="button" onClick={() => setStats(rollStats())}>
          Roll for me
        </button>
        {stats && (
          <ul className="stats-list">
            {STAT_NAMES.map((s) => (
              <li key={s}>
                {s.toUpperCase()}: {stats[s]}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={submitting || !name.trim()}>
        {submitting ? 'Creating…' : 'Create Character'}
      </button>
    </form>
  )
}
