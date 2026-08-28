import { generate } from './client.js'
import {
  DM_SYSTEM_PROMPT,
  buildTurnPrompt,
  INTRO_SYSTEM_PROMPT,
  buildIntroPrompt,
  BACKSTORY_SYSTEM_PROMPT,
  buildBackstoryPrompt,
} from './prompts.js'
import { readStory } from '../state/story.js'
import { readCharacter, slugify } from '../state/characters.js'
import { readRecentTurns, parseTurnBlock } from '../state/log.js'
import { readMap, getNearbyLocations } from '../state/map.js'

const RECENT_TURNS_FOR_CONTEXT = 6

// Safety net for the prompt's sentence-count instructions: the model doesn't
// always honor them, so hard-clip narration server-side rather than let a
// verbose response reach players and TTS unbounded.
const MAX_NARRATION_SENTENCES = 4

function capSentences(text, maxSentences = MAX_NARRATION_SENTENCES) {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g)
  if (!sentences || sentences.length <= maxSentences) return text.trim()
  return sentences.slice(0, maxSentences).join('').trim()
}

function parseDmResponse(raw) {
  const match = raw.match(/```json\s*([\s\S]*?)```\s*$/)
  if (!match) return { narration: capSentences(raw.trim()), updates: {} }

  const narration = raw.slice(0, match.index).trim()
  try {
    return { narration: capSentences(narration), updates: JSON.parse(match[1]) }
  } catch (err) {
    console.warn('DM response had an unparsable JSON block, ignoring updates:', err.message)
    return { narration: capSentences(narration || raw.trim()), updates: {} }
  }
}

export async function generateTurnResponse({ character, action, gameStateDir, scene }) {
  const story = readStory(gameStateDir)
  const characterSheet = readCharacter(gameStateDir, slugify(character))
  const recentTurns = readRecentTurns(gameStateDir, RECENT_TURNS_FOR_CONTEXT).map(parseTurnBlock)
  const nearby = getNearbyLocations(readMap(gameStateDir).data)

  const prompt = buildTurnPrompt({ story, character: characterSheet, recentTurns, scene, action, nearby })
  const raw = await generate({ system: DM_SYSTEM_PROMPT, prompt })

  return parseDmResponse(raw)
}

const INTRO_MAX_ATTEMPTS = 2
// The intro's JSON payload is much larger than a per-turn update (a full
// location graph), so give it a generous output budget to avoid truncation.
const INTRO_OPTIONS = { num_predict: 1500 }

export async function generateGameIntro({ characters }) {
  const prompt = buildIntroPrompt(characters)
  let result

  for (let attempt = 1; attempt <= INTRO_MAX_ATTEMPTS; attempt++) {
    const raw = await generate({ system: INTRO_SYSTEM_PROMPT, prompt, options: INTRO_OPTIONS })
    const { narration, updates } = parseDmResponse(raw)

    result = {
      narration,
      title: updates.title || '',
      setting: updates.setting || '',
      factions: Array.isArray(updates.factions) ? updates.factions : [],
      premise: updates.premise || '',
      mainQuest: updates.mainQuest || '',
      plan: Array.isArray(updates.plan) ? updates.plan : [],
      locations: Array.isArray(updates.locations) ? updates.locations : [],
      startLocationId: updates.startLocationId || '',
      scene: updates.scene || '',
    }

    const isComplete = result.locations.length > 0 && result.premise && result.scene
    if (isComplete) return result

    console.warn(
      `generateGameIntro attempt ${attempt} produced incomplete data${attempt < INTRO_MAX_ATTEMPTS ? ', retrying' : ', giving up and using the partial result'}.`,
    )
  }

  return result
}

export async function generateBackstory({ name, characterClass }) {
  const prompt = buildBackstoryPrompt({ name, characterClass })
  const raw = await generate({ system: BACKSTORY_SYSTEM_PROMPT, prompt })
  return raw.trim()
}
