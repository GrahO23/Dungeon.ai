import { Router } from 'express'
import { characterExists, listPublicCharacters, slugify, writeCharacter } from '../state/characters.js'
import { generateBackstory } from '../ollama/dm.js'

export function createCharactersRouter({ gameStateDir, hub }) {
  const router = Router()

  router.get('/characters', (req, res) => {
    res.json({ characters: listPublicCharacters(gameStateDir) })
  })

  router.post('/characters/generate-backstory', async (req, res) => {
    const { name, characterClass } = req.body ?? {}
    if (typeof name !== 'string' || !name.trim() || typeof characterClass !== 'string' || !characterClass.trim()) {
      return res.status(400).json({ error: 'name and characterClass are required' })
    }

    try {
      const backstory = await generateBackstory({ name: name.trim(), characterClass: characterClass.trim() })
      res.json({ backstory })
    } catch (err) {
      console.error('Failed to generate backstory:', err)
      res.status(502).json({ error: 'The DM failed to come up with a backstory. Please try again.' })
    }
  })

  router.post('/characters', (req, res) => {
    const { name, characterClass, stats, backstory } = req.body ?? {}

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const slug = slugify(name)
    if (!slug) {
      return res.status(400).json({ error: 'name must contain letters or numbers' })
    }
    if (characterExists(gameStateDir, slug)) {
      return res.status(409).json({ error: 'a character with that name already exists' })
    }

    const data = {
      name: name.trim(),
      class: characterClass?.trim() || 'Adventurer',
      level: 1,
      hp: 10,
      maxHp: 10,
      stats: stats && typeof stats === 'object' ? stats : {},
      inventory: [],
      status: 'active',
    }
    const content = `## Backstory\n${backstory?.trim() || '_No backstory provided._'}\n\n## Notes\n`
    writeCharacter(gameStateDir, slug, data, content)

    const characters = listPublicCharacters(gameStateDir)
    hub.broadcast('roster:updated', { characters })
    res.status(201).json({ character: { slug, ...data } })
  })

  return router
}
