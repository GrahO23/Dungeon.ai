import fs from 'node:fs'
import path from 'node:path'
import { readMarkdown, writeMarkdown } from './markdown.js'
import { slugify } from './characters.js'
import { readMap, getCurrentLocation } from './map.js'

const DIR = 'enemies'

function enemiesDir(gameStateDir) {
  return path.join(gameStateDir, DIR)
}

function enemyPath(gameStateDir, slug) {
  return path.join(enemiesDir(gameStateDir), `${slug}.md`)
}

export function enemyExists(gameStateDir, slug) {
  return fs.existsSync(enemyPath(gameStateDir, slug))
}

export function listEnemies(gameStateDir) {
  const dir = enemiesDir(gameStateDir)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '')
      return { slug, ...readEnemy(gameStateDir, slug) }
    })
}

export function readEnemy(gameStateDir, slug) {
  return readMarkdown(enemyPath(gameStateDir, slug))
}

export function writeEnemy(gameStateDir, slug, data, content = '') {
  writeMarkdown(enemyPath(gameStateDir, slug), data, content)
}

// The enemies/NPCs currently present at a location — the bounded context fed
// to intent classification, combat resolution, and per-turn dialogue. Hostile
// entries must still be alive to count (a defeated enemy is no longer a valid
// target); friendly NPCs are never gated on hp, since a friendly NPC meant
// purely for conversation may have no combat stats (and no hp) at all.
export function listEnemiesAtLocation(gameStateDir, locationId) {
  return listEnemies(gameStateDir).filter((enemy) => {
    if (enemy.data.locationId !== locationId) return false
    if (enemy.data.hostile === false) return true
    return (enemy.data.hp ?? 0) > 0
  })
}

// Display-only counterpart to listEnemiesAtLocation — includes defeated
// enemies and non-hostile NPCs too (so the Enemies panel can show a fight as
// won rather than the target just vanishing), trimmed to the fields safe to
// send to every client. Never used for combat/intent resolution — that stays
// on listEnemiesAtLocation's alive-only, full-data view.
export function listPublicEnemiesAtLocation(gameStateDir, locationId) {
  return listEnemies(gameStateDir)
    .filter((enemy) => enemy.data.locationId === locationId)
    .map(({ data }) => ({
      name: data.name,
      kind: data.kind ?? 'enemy',
      hp: data.hp ?? 0,
      maxHp: data.maxHp ?? data.hp ?? 0,
      hostile: data.hostile !== false,
      status: data.status,
      personality: data.personality,
      resistances: data.resistances ?? [],
      vulnerabilities: data.vulnerabilities ?? [],
      loot: data.loot ?? [],
    }))
}

// Convenience wrapper for the common case (every call site cares about
// "what's here right now", not an arbitrary location id).
export function listPublicEnemiesHere(gameStateDir) {
  const current = getCurrentLocation(readMap(gameStateDir).data)
  return current ? listPublicEnemiesAtLocation(gameStateDir, current.id) : []
}

// Defeated hostile enemies at a location that still hold unclaimed `loot` —
// the bounded context for a "loot" action (engine/actionResolver.js).
// Deliberately the opposite gate from listEnemiesAtLocation's
// hostile-must-be-alive rule: a hostile entry only counts once it's *dead*,
// since loot is claimed from a corpse, not a living target. Requires
// `hostile !== false` (not just hp <= 0) so a friendly NPC with no combat
// stats — hp left unset, per listEnemiesAtLocation's own convention — can
// never be mistaken for a lootable corpse.
export function listLootableEnemiesAtLocation(gameStateDir, locationId) {
  return listEnemies(gameStateDir).filter(
    (enemy) =>
      enemy.data.locationId === locationId &&
      enemy.data.hostile !== false &&
      (enemy.data.hp ?? 0) <= 0 &&
      enemy.data.loot?.length,
  )
}

// update: {
//   hp?: number (delta), status?: string, locationId?: string,
//   spellUsesRemaining?: number (absolute),
//   statusEffects_add?: { name: string, turnsRemaining?: number|null }[],
//   statusEffects_remove?: string[] (names),
//   loot?: string[] (absolute replace — used to clear it once claimed),
// }
export function applyEnemyUpdate(gameStateDir, name, update) {
  const slug = slugify(name)
  if (!enemyExists(gameStateDir, slug)) return false

  const { data, content } = readEnemy(gameStateDir, slug)
  const nextData = { ...data }

  if (typeof update.hp === 'number') {
    const maxHp = nextData.maxHp ?? nextData.hp
    nextData.hp = Math.max(0, Math.min(maxHp, (nextData.hp ?? 0) + update.hp))
  }
  if (update.status) {
    nextData.status = update.status
  }
  if (update.locationId) {
    nextData.locationId = update.locationId
  }
  if (typeof update.spellUsesRemaining === 'number') {
    nextData.spellUsesRemaining = Math.max(0, update.spellUsesRemaining)
  }
  if (Array.isArray(update.statusEffects_add) && update.statusEffects_add.length) {
    const existing = (nextData.statusEffects ?? []).filter(
      (effect) => !update.statusEffects_add.some((added) => added.name === effect.name),
    )
    nextData.statusEffects = [...existing, ...update.statusEffects_add]
  }
  if (Array.isArray(update.statusEffects_remove) && update.statusEffects_remove.length) {
    nextData.statusEffects = (nextData.statusEffects ?? []).filter(
      (effect) => !update.statusEffects_remove.includes(effect.name),
    )
  }
  if (Array.isArray(update.loot)) {
    nextData.loot = update.loot
  }

  writeEnemy(gameStateDir, slug, nextData, content)
  return true
}

// Mirrors characters.js#tickStatusEffects for enemies — decrements
// turnsRemaining on this enemy's statusEffects by 1 (once per its own turn
// — engine/turnEngine.js) and drops any that hit zero.
export function tickStatusEffects(gameStateDir, name) {
  const slug = slugify(name)
  if (!enemyExists(gameStateDir, slug)) return false

  const { data, content } = readEnemy(gameStateDir, slug)
  const effects = data.statusEffects ?? []
  if (!effects.length) return false

  const nextEffects = effects
    .map((effect) => (typeof effect.turnsRemaining === 'number' ? { ...effect, turnsRemaining: effect.turnsRemaining - 1 } : effect))
    .filter((effect) => effect.turnsRemaining == null || effect.turnsRemaining > 0)

  writeEnemy(gameStateDir, slug, { ...data, statusEffects: nextEffects }, content)
  return true
}
