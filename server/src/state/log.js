import fs from 'node:fs'
import path from 'node:path'
import { appendToFile } from './markdown.js'

const FILE = 'log.md'

function logPath(gameStateDir) {
  return path.join(gameStateDir, FILE)
}

export function appendTurn(gameStateDir, { turnNumber, character, playerText, dmText }) {
  const block = `## Turn ${turnNumber} — ${character}\n**Player:** ${playerText}\n**DM:** ${dmText}\n\n`
  appendToFile(logPath(gameStateDir), block)
}

// Returns the last `count` turn blocks as an array of raw text sections,
// oldest first. Used both for the in-memory ring buffer and to rebuild it on restart.
export function readRecentTurns(gameStateDir, count = 8) {
  const file = logPath(gameStateDir)
  if (!fs.existsSync(file)) return []
  const raw = fs.readFileSync(file, 'utf8')
  const sections = raw
    .split(/(?=^## Turn )/m)
    .map((s) => s.trim())
    .filter(Boolean)
  return sections.slice(-count)
}

export function parseTurnBlock(block) {
  const header = block.match(/^## Turn (\d+) — (.+)$/m)
  const player = block.match(/^\*\*Player:\*\* (.+)$/m)
  const dm = block.match(/^\*\*DM:\*\* ([\s\S]*)/m)
  return {
    turnNumber: header ? Number(header[1]) : null,
    character: header ? header[2].trim() : null,
    playerText: player ? player[1].trim() : '',
    dmText: dm ? dm[1].trim() : '',
  }
}
