import { Router } from 'express'
import fs from 'node:fs'
import { config } from '../config.js'
import { synthesize } from '../tts/piper.js'

const MAX_TEXT_LENGTH = 2000

export function createTtsRouter() {
  const router = Router()

  router.post('/tts', async (req, res) => {
    if (!config.ttsEnabled || !fs.existsSync(config.piperBin)) {
      return res.status(503).json({ error: 'TTS is not available on this server.' })
    }

    const { text } = req.body ?? {}
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required' })
    }

    try {
      const audio = await synthesize(text.slice(0, MAX_TEXT_LENGTH))
      res.set('Content-Type', 'audio/wav')
      res.send(audio)
    } catch (err) {
      console.error('TTS synthesis failed:', err)
      res.status(502).json({ error: 'Failed to synthesize speech.' })
    }
  })

  return router
}
