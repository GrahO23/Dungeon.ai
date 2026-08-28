import path from 'node:path'
import { readMarkdown, writeMarkdown } from './markdown.js'

const FILE = 'world.md'

export function readWorld(gameStateDir) {
  return readMarkdown(path.join(gameStateDir, FILE), {
    data: { title: null, generatedAt: null },
    content: '',
  })
}

export function writeWorld(gameStateDir, { title, generatedAt = new Date().toISOString() }, body) {
  writeMarkdown(path.join(gameStateDir, FILE), { title, generatedAt }, body)
}
