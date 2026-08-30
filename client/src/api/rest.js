export async function getCharacters() {
  const res = await fetch('/api/characters')
  if (!res.ok) throw new Error('Failed to load characters')
  return res.json()
}

export async function createCharacter(payload) {
  const res = await fetch('/api/characters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create character')
  return data
}

export async function generateBackstory(name, characterClass) {
  const res = await fetch('/api/characters/generate-backstory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, characterClass }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to generate backstory')
  return data.backstory
}

export async function startGame() {
  const res = await fetch('/api/setup/start', { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to start game')
  return data
}

export async function getScenarios() {
  const res = await fetch('/api/scenarios')
  if (!res.ok) throw new Error('Failed to load scenarios')
  return res.json()
}

export async function startScenario(slug) {
  const res = await fetch('/api/setup/start-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to start scenario')
  return data
}

export async function getVoices() {
  const res = await fetch('/api/tts/voices')
  if (!res.ok) throw new Error('Failed to load voices')
  return res.json()
}

export async function getModels() {
  const res = await fetch('/api/models')
  if (!res.ok) throw new Error('Failed to load models')
  return res.json()
}

export async function selectModel(model) {
  const res = await fetch('/api/models/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to select model')
  return data
}
