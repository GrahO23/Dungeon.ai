import path from 'node:path'
import { readMarkdown, writeMarkdown } from './markdown.js'
import { getBullets, setBullets } from './sections.js'

const FILE = 'story.md'
const STORY_SO_FAR = 'Story So Far'
const MAX_STORY_NOTES = 30

export function readStory(gameStateDir) {
  return readMarkdown(path.join(gameStateDir, FILE), {
    data: { status: 'setup', currentAct: 1 },
    content: '',
  })
}

export function writeStory(gameStateDir, data, content) {
  writeMarkdown(path.join(gameStateDir, FILE), data, content)
}

export function appendStoryNote(gameStateDir, note) {
  const { data, content } = readStory(gameStateDir)
  const bullets = [...getBullets(content, STORY_SO_FAR), note].slice(-MAX_STORY_NOTES)
  const nextContent = setBullets(content, STORY_SO_FAR, bullets)
  writeStory(gameStateDir, data, nextContent)
}
