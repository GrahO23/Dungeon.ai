import fs from 'node:fs'
import path from 'node:path'
import { readMarkdown, writeMarkdown } from './markdown.js'
import { slugify } from './characters.js'

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

// The enemies/NPCs currently present at a location and still alive — the
// bounded context fed to intent classification and combat resolution.
export function listEnemiesAtLocation(gameStateDir, locationId) {
  return listEnemies(gameStateDir).filter(
    (enemy) => enemy.data.locationId === locationId && (enemy.data.hp ?? 0) > 0,
  )
}

// update: { hp?: number (delta), status?: string }
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

  writeEnemy(gameStateDir, slug, nextData, content)
  return true
}
