import { Router } from 'express'
import { listModels } from '../ollama/client.js'
import { getCurrentModel, setCurrentModel } from '../ollama/modelState.js'
import { listClaudeModels } from '../anthropic/client.js'

// Ollama being unreachable no longer means the endpoint fails outright — as
// long as at least one provider (Ollama models, or Claude models when an
// ANTHROPIC_API_KEY is configured) has something to offer, the switcher stays
// usable. It only 502s when neither provider has anything.
async function listAllModels() {
  let ollamaModels = []
  try {
    ollamaModels = await listModels()
  } catch (err) {
    console.error('Failed to list Ollama models:', err)
  }
  return [...ollamaModels, ...listClaudeModels()]
}

export function createModelsRouter({ hub, gameState }) {
  const router = Router()

  router.get('/models', async (req, res) => {
    const models = await listAllModels()
    if (models.length === 0) {
      return res.status(502).json({ error: 'Failed to reach Ollama.' })
    }
    res.json({ models, current: getCurrentModel() })
  })

  router.post('/models/select', async (req, res) => {
    if (gameState.get().sessionStatus !== 'setup') {
      return res.status(409).json({ error: 'The DM model can only be changed before the game starts.' })
    }

    const { model } = req.body ?? {}
    if (typeof model !== 'string' || !model.trim()) {
      return res.status(400).json({ error: 'model is required' })
    }

    const models = await listAllModels()
    if (!models.some((m) => m.name === model)) {
      return res.status(400).json({ error: `"${model}" is not an available model.` })
    }

    setCurrentModel(model)
    hub.broadcast('model:changed', { model })
    res.json({ current: model })
  })

  return router
}
