import { generate } from './client.js'
import { DM_SYSTEM_PROMPT, buildTurnPrompt, INTRO_SYSTEM_PROMPT, buildIntroPrompt } from './prompts.js'
import { readStory } from '../state/story.js'
import { readCharacter, slugify } from '../state/characters.js'
import { readRecentTurns, parseTurnBlock } from '../state/log.js'

const RECENT_TURNS_FOR_CONTEXT = 6

function parseDmResponse(raw) {
  const match = raw.match(/```json\s*([\s\S]*?)```\s*$/)
  if (!match) return { narration: raw.trim(), updates: {} }

  const narration = raw.slice(0, match.index).trim()
  try {
    return { narration, updates: JSON.parse(match[1]) }
  } catch (err) {
    console.warn('DM response had an unparsable JSON block, ignoring updates:', err.message)
    return { narration: narration || raw.trim(), updates: {} }
  }
}

export async function generateTurnResponse({ character, action, gameStateDir, scene }) {
  const story = readStory(gameStateDir)
  const characterSheet = readCharacter(gameStateDir, slugify(character))
  const recentTurns = readRecentTurns(gameStateDir, RECENT_TURNS_FOR_CONTEXT).map(parseTurnBlock)

  const prompt = buildTurnPrompt({ story, character: characterSheet, recentTurns, scene, action })
  const raw = await generate({ system: DM_SYSTEM_PROMPT, prompt })

  return parseDmResponse(raw)
}

export async function generateGameIntro({ characters }) {
  const prompt = buildIntroPrompt(characters)
  const raw = await generate({ system: INTRO_SYSTEM_PROMPT, prompt })
  const { narration, updates } = parseDmResponse(raw)

  return {
    narration,
    premise: updates.premise || '',
    mainQuest: updates.mainQuest || '',
    scene: updates.scene || '',
  }
}
