import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'

// Model ids are stored/broadcast with this prefix (e.g. "claude:claude-sonnet-5")
// so they live in the same flat "current model" string as Ollama tags
// (ollama/modelState.js) without ever colliding with a real Ollama tag name.
const PREFIX = 'claude:'

// Fixed, curated list rather than a live /v1/models call — this app only ever
// wants a "fast/cheap" and a "high quality" cloud option, not every model
// Anthropic exposes. Only offered when an API key is configured (see
// listClaudeModels), since without one these can never actually be called.
const CLAUDE_MODELS = [
  { id: `${PREFIX}claude-haiku-4-5`, label: 'Claude Haiku 4.5 (cloud)' },
  { id: `${PREFIX}claude-sonnet-5`, label: 'Claude Sonnet 5 (cloud)' },
]

// Per-turn narration is short (a capped few sentences plus a small JSON
// update block, per ollama/dm.js#MAX_NARRATION_SENTENCES) — 1024 tokens is
// generous headroom without inviting a runaway response the way a much
// larger default would. Ollama-style callers that need more (the game-intro
// call's larger location graph, the intent classifier's tiny budget) already
// pass options.num_predict, which takes priority.
const DEFAULT_MAX_TOKENS = 1024

let client

function getClient() {
  if (!client) client = new Anthropic({ apiKey: config.anthropicApiKey })
  return client
}

export function isClaudeModel(model) {
  return typeof model === 'string' && model.startsWith(PREFIX)
}

// Empty until an ANTHROPIC_API_KEY is set — this is what keeps the model
// switcher from ever offering (or accepting) a Claude option nobody can
// actually reach.
export function listClaudeModels() {
  if (!config.anthropicApiKey) return []
  return CLAUDE_MODELS.map(({ id, label }) => ({ name: id, parameterSize: null, family: 'anthropic', label }))
}

export async function generate({ model, system, prompt, options }) {
  const anthropicModel = model.slice(PREFIX.length)
  const res = await getClient().messages.create({
    model: anthropicModel,
    max_tokens: options?.num_predict ?? DEFAULT_MAX_TOKENS,
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = res.content.find((block) => block.type === 'text')
  return textBlock?.text ?? ''
}
