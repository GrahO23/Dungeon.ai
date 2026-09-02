import path from 'node:path'
import { readMarkdown, writeMarkdown } from '../state/markdown.js'
import { getSection } from '../state/sections.js'

const FILE = 'state.md'

const DEFAULTS = {
  sessionStatus: 'setup', // setup | playing | paused | ended
  turnOrder: [],
  currentTurnIndex: 0,
  turnNumber: 0,
  combatActive: false,
}

export function createGameState(gameStateDir) {
  const filePath = path.join(gameStateDir, FILE)
  let data = { ...DEFAULTS }
  let scene = ''

  function load() {
    const parsed = readMarkdown(filePath, { data: { ...DEFAULTS }, content: '' })
    data = { ...DEFAULTS, ...parsed.data }
    // Read back just the section body, not the raw file content — persist()
    // always writes a "## Current Scene" header, and taking the whole body
    // verbatim here would bake that header into `scene` itself, duplicating
    // it on every subsequent persist() (compounding on every restart).
    scene = getSection(parsed.content, 'Current Scene') || parsed.content
    return get()
  }

  function get() {
    return { ...data, currentScene: scene }
  }

  function persist() {
    writeMarkdown(
      filePath,
      { ...data, lastUpdated: new Date().toISOString() },
      `## Current Scene\n${scene || '_Not yet set._'}`,
    )
  }

  function update(patch) {
    const { currentScene, ...rest } = patch
    if (currentScene !== undefined) scene = currentScene
    data = { ...data, ...rest }
    persist()
    return get()
  }

  load()

  return { get, update, reload: load }
}
