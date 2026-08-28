import { Router } from 'express'
import { listModels } from '../ollama/client.js'
import { getCurrentModel, setCurrentModel } from '../ollama/modelState.js'

export function createModelsRouter({ hub }) {
  const router = Router()

  router.get('/models', async (req, res) => {
    try {
      const models = await listModels()
      res.json({ models, current: getCurrentModel() })
    } catch (err) {
      console.error('Failed to list Ollama models:', err)
      res.status(502).json({ error: 'Failed to reach Ollama.' })
    }
  })

  router.post('/models/select', async (req, res) => {
    const { model } = req.body ?? {}
    if (typeof model !== 'string' || !model.trim()) {
      return res.status(400).json({ error: 'model is required' })
    }

    let models
    try {
      models = await listModels()
    } catch (err) {
      console.error('Failed to reach Ollama while selecting model:', err)
      return res.status(502).json({ error: 'Failed to reach Ollama.' })
    }

    if (!models.some((m) => m.name === model)) {
      return res.status(400).json({ error: `"${model}" is not an installed Ollama model.` })
    }

    setCurrentModel(model)
    hub.broadcast('model:changed', { model })
    res.json({ current: model })
  })

  return router
}
