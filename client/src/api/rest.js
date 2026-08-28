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

export async function startGame() {
  const res = await fetch('/api/setup/start', { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to start game')
  return data
}
