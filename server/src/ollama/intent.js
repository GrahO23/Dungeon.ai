import { generate } from './client.js'
import { INTENT_SYSTEM_PROMPT, buildIntentPrompt } from './prompts.js'

// Kept small/cheap — this runs as an extra call before every turn's
// narration, so it needs to stay fast.
const INTENT_OPTIONS = { num_predict: 150 }
const VALID_TYPES = new Set(['attack', 'skill-check', 'item-use', 'move', 'dialogue', 'other'])
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])

function parseIntent(raw) {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return { type: 'other' }

  try {
    const parsed = JSON.parse(match[0])
    if (!VALID_TYPES.has(parsed.type)) return { type: 'other' }
    return {
      type: parsed.type,
      target: typeof parsed.target === 'string' ? parsed.target : '',
      skill: typeof parsed.skill === 'string' ? parsed.skill : '',
      item: typeof parsed.item === 'string' ? parsed.item : '',
      difficulty: VALID_DIFFICULTIES.has(parsed.difficulty) ? parsed.difficulty : 'medium',
    }
  } catch (err) {
    console.warn('Intent classification returned unparsable JSON, falling back to "other":', err.message)
    return { type: 'other' }
  }
}

// Fail-soft by design: classification is a pre-step, never a hard dependency
// of a turn — any failure just falls back to "other" (today's unmodified,
// fully LLM-narrated flow) rather than blocking the turn.
export async function classifyAction({ actionText, character, enemiesHere }) {
  try {
    const prompt = buildIntentPrompt({ actionText, character, enemiesHere })
    const raw = await generate({ system: INTENT_SYSTEM_PROMPT, prompt, options: INTENT_OPTIONS, format: 'json' })
    return parseIntent(raw)
  } catch (err) {
    console.warn('Intent classification call failed, falling back to "other":', err.message)
    return { type: 'other' }
  }
}
