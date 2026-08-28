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
  }))
}

export function writeCharacter(gameStateDir, slug, data, content) {
  writeMarkdown(characterPath(gameStateDir, slug), data, content)
}

// update: { hp?: number (delta), inventory_add?: string[], status?: string, note?: string }
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
  if (update.status) {
    nextData.status = update.status
  }

  let nextContent = content
  if (update.note) {
    const notes = [...getBullets(content, 'Notes'), update.note]
    nextContent = setBullets(content, 'Notes', notes)
  }

  writeCharacter(gameStateDir, slug, nextData, nextContent)
  return true
}
