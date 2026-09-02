import { generate, generateStructured } from './client.js'
import {
  DM_SYSTEM_PROMPT,
  buildTurnPrompt,
  INTRO_SYSTEM_PROMPT,
  buildIntroPrompt,
  BACKSTORY_SYSTEM_PROMPT,
  buildBackstoryPrompt,
  EVENT_SYSTEM_PROMPT,
  buildEventPrompt,
} from './prompts.js'
import { TURN_RESPONSE_SCHEMA, INTRO_RESPONSE_SCHEMA } from './schemas.js'
import { readStory } from '../state/story.js'
import { readCharacter, slugify } from '../state/characters.js'
import { readRecentTurns, parseTurnBlock } from '../state/log.js'
import { readMap, getNearbyLocations } from '../state/map.js'
import { listEnemiesAtLocation } from '../state/enemies.js'

const RECENT_TURNS_FOR_CONTEXT = 6

// Safety net for the prompt's sentence-count instructions: the model doesn't
// always honor them, so hard-clip narration server-side rather than let a
// verbose response reach players and TTS unbounded. Schema constraints
// (see schemas.js) guarantee shape, not sentence count, so this still earns
// its keep even though the response is otherwise structurally guaranteed.
const MAX_NARRATION_SENTENCES = 4

export function capSentences(text, maxSentences = MAX_NARRATION_SENTENCES) {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g)
  if (!sentences || sentences.length <= maxSentences) return text.trim()
  return sentences.slice(0, maxSentences).join('').trim()
}

export async function generateTurnResponse({ character, action, gameStateDir, scene, resolvedOutcome }) {
  const story = readStory(gameStateDir)
  const characterSheet = readCharacter(gameStateDir, slugify(character))
  const recentTurns = readRecentTurns(gameStateDir, RECENT_TURNS_FOR_CONTEXT).map(parseTurnBlock)
  const nearby = getNearbyLocations(readMap(gameStateDir).data)
  const npcsHere = nearby.current ? listEnemiesAtLocation(gameStateDir, nearby.current.id) : []

  const prompt = buildTurnPrompt({ story, character: characterSheet, recentTurns, scene, action, nearby, npcsHere, resolvedOutcome })
  const result = await generateStructured({ system: DM_SYSTEM_PROMPT, prompt, schema: TURN_RESPONSE_SCHEMA })

  return {
    narration: capSentences(result.narration ?? ''),
    updates: {
      characterUpdates: result.characterUpdates ?? [],
      sceneUpdate: result.sceneUpdate,
      locationUpdate: result.locationUpdate,
      storyNote: result.storyNote,
    },
  }
}

const EVENT_MAX_SENTENCES = 3

// Narrates a deterministically-resolved event with no acting player behind
// it (an enemy's combat turn) — a much smaller prompt than a full player
// turn since it needs no character/inventory/skills context.
export async function narrateResolvedEvent({ scene, resolvedOutcome }) {
  const prompt = buildEventPrompt({ scene, resolvedOutcome })
  const raw = await generate({ system: EVENT_SYSTEM_PROMPT, prompt })
  return capSentences(raw.trim(), EVENT_MAX_SENTENCES)
}

const INTRO_MAX_ATTEMPTS = 2
// The intro's JSON payload is much larger than a per-turn update (a full
// location graph with richer descriptions, plus a roster of NPCs), so give
// it a generous output budget to avoid truncation.
const INTRO_OPTIONS = { num_predict: 2200 }

// Always-shaped default so callers (routes/setup.js#resolveMap in
// particular) never have to guard against generateGameIntro returning
// undefined — even if every attempt below throws (e.g. Ollama unreachable).
const EMPTY_INTRO_RESULT = {
  narration: '',
  title: '',
  setting: '',
  factions: [],
  premise: '',
  mainQuest: '',
  plan: [],
  locations: [],
  startLocationId: '',
  scene: '',
  npcs: [],
}

export async function generateGameIntro({ characters }) {
  const prompt = buildIntroPrompt(characters)
  let result = EMPTY_INTRO_RESULT

  for (let attempt = 1; attempt <= INTRO_MAX_ATTEMPTS; attempt++) {
    try {
      const updates = await generateStructured({
        system: INTRO_SYSTEM_PROMPT,
        prompt,
        schema: INTRO_RESPONSE_SCHEMA,
        options: INTRO_OPTIONS,
      })

      result = {
        narration: capSentences(updates.narration ?? ''),
        title: updates.title || '',
        setting: updates.setting || '',
        factions: Array.isArray(updates.factions) ? updates.factions : [],
        premise: updates.premise || '',
        mainQuest: updates.mainQuest || '',
        plan: Array.isArray(updates.plan) ? updates.plan : [],
        locations: Array.isArray(updates.locations) ? updates.locations : [],
        startLocationId: updates.startLocationId || '',
        scene: updates.scene || '',
        npcs: Array.isArray(updates.npcs) ? updates.npcs : [],
      }

      const isComplete = result.locations.length > 0 && result.premise && result.scene
      if (isComplete) return result

      console.warn(
        `generateGameIntro attempt ${attempt} produced incomplete data${attempt < INTRO_MAX_ATTEMPTS ? ', retrying' : ', giving up and using the partial result'}.`,
      )
    } catch (err) {
      // A schema-constrained response can still come back truncated if the
      // model hits num_predict mid-object — that surfaces here as a thrown
      // JSON-parse error rather than silently-incomplete fields. Treat it
      // exactly like an incomplete attempt: retry, or give up with whatever
      // the last successful attempt (if any) produced.
      console.warn(`generateGameIntro attempt ${attempt} failed to parse: ${err.message}`)
    }
  }

  return result
}

export async function generateBackstory({ name, characterClass }) {
  const prompt = buildBackstoryPrompt({ name, characterClass })
  const raw = await generate({ system: BACKSTORY_SYSTEM_PROMPT, prompt })
  return raw.trim()
}
