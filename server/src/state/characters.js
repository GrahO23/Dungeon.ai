import fs from 'node:fs'
import path from 'node:path'
import { readMarkdown, writeMarkdown } from './markdown.js'
import { getBullets, setBullets } from './sections.js'

const DIR = 'characters'

export function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function charactersDir(gameStateDir) {
  return path.join(gameStateDir, DIR)
}

function characterPath(gameStateDir, slug) {
  return path.join(charactersDir(gameStateDir), `${slug}.md`)
}

export function characterExists(gameStateDir, slug) {
  return fs.existsSync(characterPath(gameStateDir, slug))
}

export function listCharacters(gameStateDir) {
  const dir = charactersDir(gameStateDir)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.replace(/\.md$/, '')
      return { slug, ...readCharacter(gameStateDir, slug) }
    })
}

export function readCharacter(gameStateDir, slug) {
  return readMarkdown(characterPath(gameStateDir, slug))
}

export function listPublicCharacters(gameStateDir) {
  return listCharacters(gameStateDir).map(({ slug, data }) => ({
    slug,
    name: data.name,
    class: data.class,
    level: data.level,
    hp: data.hp,
    maxHp: data.maxHp,
    ac: data.ac,
    stats: data.stats ?? {},
    skills: data.skills ?? {},
    inventory: data.inventory ?? [],
    equippedWeapon: data.equippedWeapon,
    status: data.status,
    statusEffects: data.statusEffects ?? [],
    abilities: data.abilities ?? [],
    luck: data.luck ?? 0,
  }))
}

export function writeCharacter(gameStateDir, slug, data, content) {
  writeMarkdown(characterPath(gameStateDir, slug), data, content)
}

function itemName(item) {
  return typeof item === 'string' ? item : item.name
}

// Removes one item by name — decrements qty on a structured item, removes it
// once qty hits 0, or removes a plain string item outright.
function removeInventoryItem(inventory, name, qty = 1) {
  const index = inventory.findIndex((item) => itemName(item) === name)
  if (index === -1) return inventory

  const item = inventory[index]
  if (typeof item === 'string' || !(item.qty > qty)) {
    return [...inventory.slice(0, index), ...inventory.slice(index + 1)]
  }
  const next = [...inventory]
  next[index] = { ...item, qty: item.qty - qty }
  return next
}

// update: {
//   hp?: number (delta),
//   inventory_add?: (string | { name, qty?, type?, effect?, damageDice?, finesse? })[],
//   inventory_remove?: { name: string, qty?: number }[],
//   skills?: { [name]: number } (merged in as deltas on top of existing bonuses),
//   statusEffects_add?: { name: string, turnsRemaining?: number|null }[],
//   statusEffects_remove?: string[] (names),
//   abilities_add?: { name: string, level: number, description?: string }[] (a newly learned spell or special move),
//   abilities_remove?: string[] (names),
//   status?: string,
//   luck?: number (delta, clamped to >= 0),
//   note?: string,
// }
export function applyCharacterUpdate(gameStateDir, name, update) {
  const slug = slugify(name)
  if (!characterExists(gameStateDir, slug)) return false

  const { data, content } = readCharacter(gameStateDir, slug)
  const nextData = { ...data }

  if (typeof update.hp === 'number') {
    const maxHp = nextData.maxHp ?? nextData.hp
    nextData.hp = Math.max(0, Math.min(maxHp, (nextData.hp ?? 0) + update.hp))
  }
  if (Array.isArray(update.inventory_add) && update.inventory_add.length) {
    nextData.inventory = [...(nextData.inventory ?? []), ...update.inventory_add]
  }
  if (Array.isArray(update.inventory_remove) && update.inventory_remove.length) {
    nextData.inventory = update.inventory_remove.reduce(
      (inventory, { name: itemToRemove, qty }) => removeInventoryItem(inventory, itemToRemove, qty),
      nextData.inventory ?? [],
    )
  }
  if (update.skills && typeof update.skills === 'object') {
    nextData.skills = { ...(nextData.skills ?? {}) }
    for (const [skill, delta] of Object.entries(update.skills)) {
      nextData.skills[skill] = (nextData.skills[skill] ?? 0) + delta
    }
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
  if (Array.isArray(update.abilities_add) && update.abilities_add.length) {
    const existing = (nextData.abilities ?? []).filter(
      (ability) => !update.abilities_add.some((added) => added.name === ability.name),
    )
    nextData.abilities = [...existing, ...update.abilities_add]
  }
  if (Array.isArray(update.abilities_remove) && update.abilities_remove.length) {
    nextData.abilities = (nextData.abilities ?? []).filter((ability) => !update.abilities_remove.includes(ability.name))
  }
  if (update.status) {
    nextData.status = update.status
  }
  if (typeof update.luck === 'number') {
    nextData.luck = Math.max(0, (nextData.luck ?? 0) + update.luck)
  }

  let nextContent = content
  if (update.note) {
    const notes = [...getBullets(content, 'Notes'), update.note]
    nextContent = setBullets(content, 'Notes', notes)
  }

  writeCharacter(gameStateDir, slug, nextData, nextContent)
  return true
}
