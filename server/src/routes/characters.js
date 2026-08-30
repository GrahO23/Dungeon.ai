import { Router } from 'express'
import { characterExists, listPublicCharacters, slugify, writeCharacter } from '../state/characters.js'
import { generateBackstory } from '../ollama/dm.js'
import { computeAC } from '../rules/combat.js'
import { CLASS_SKILL_BONUS, CLASS_STARTING_WEAPON } from '../rules/constants.js'

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

    const resolvedClass = characterClass?.trim() || 'Adventurer'
    const resolvedStats = stats && typeof stats === 'object' ? stats : {}
    const startingWeapon = CLASS_STARTING_WEAPON[resolvedClass]

    const data = {
      name: name.trim(),
      class: resolvedClass,
      level: 1,
      hp: 10,
      maxHp: 10,
      ac: computeAC({ stats: resolvedStats }),
      stats: resolvedStats,
      skills: { ...(CLASS_SKILL_BONUS[resolvedClass] ?? {}) },
      inventory: [
        { name: 'Healing Potion', qty: 2, type: 'consumable', effect: { hp: 8 } },
        { name: 'Bandage', qty: 3, type: 'consumable', effect: { hp: 3 } },
      ],
      equippedWeapon: startingWeapon?.name,
      status: 'active',
      statusEffects: [],
      luck: 1,
    }
    const content = `## Backstory\n${backstory?.trim() || '_No backstory provided._'}\n\n## Notes\n`
    writeCharacter(gameStateDir, slug, data, content)

    const characters = listPublicCharacters(gameStateDir)
    hub.broadcast('roster:updated', { characters })
    res.status(201).json({ character: { slug, ...data } })
  })

  return router
}
