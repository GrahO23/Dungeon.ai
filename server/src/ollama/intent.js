import { generateStructured } from './client.js'
import { INTENT_SYSTEM_PROMPT, buildIntentPrompt } from './prompts.js'
import { INTENT_SCHEMA } from './schemas.js'

// Kept small/cheap — this runs as an extra call before every turn's
// narration, so it needs to stay fast.
const INTENT_OPTIONS = { num_predict: 150 }

// Fail-soft by design: classification is a pre-step, never a hard dependency
// of a turn — any failure just falls back to "other" (today's unmodified,
// fully LLM-narrated flow) rather than blocking the turn. The schema
// (schemas.js) already enforces valid enums/types, so this is just a light
// coercion pass rather than the manual validation it used to be.
export async function classifyAction({ actionText, character, enemiesHere, lootableHere }) {
  try {
    const prompt = buildIntentPrompt({ actionText, character, enemiesHere, lootableHere })
    const parsed = await generateStructured({ system: INTENT_SYSTEM_PROMPT, prompt, schema: INTENT_SCHEMA, options: INTENT_OPTIONS })
    return {
      type: parsed.type,
      target: parsed.target ?? '',
      skill: parsed.skill ?? '',
      item: parsed.item ?? '',
      ability: parsed.ability ?? '',
      difficulty: parsed.difficulty || 'medium',
    }
  } catch (err) {
    console.warn('Intent classification call failed, falling back to "other":', err.message)
    return { type: 'other' }
  }
}
