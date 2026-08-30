import { Router } from 'express'
import fs from 'node:fs'
import { config } from '../config.js'
import { synthesize } from '../tts/piper.js'
import { listVoices, defaultVoiceId } from '../tts/voices.js'

const MAX_TEXT_LENGTH = 2000

function ttsAvailable() {
  return config.ttsEnabled && fs.existsSync(config.piperBin)
}

export function createTtsRouter() {
  const router = Router()

  // Voice choice and speed are per-browser preferences (like the existing
  // voiceEnabled toggle), sent with each request — not shared server state —
  // since synthesis already happens independently per client on every call.
  router.get('/tts/voices', (req, res) => {
    if (!ttsAvailable()) {
      return res.status(503).json({ error: 'TTS is not available on this server.' })
    }
    res.json({ voices: listVoices(), current: defaultVoiceId() })
  })

  router.post('/tts', async (req, res) => {
    if (!ttsAvailable()) {
      return res.status(503).json({ error: 'TTS is not available on this server.' })
    }

    const { text, voice, speed } = req.body ?? {}
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required' })
    }

    try {
      const audio = await synthesize(text.slice(0, MAX_TEXT_LENGTH), { voice, speed })
      res.set('Content-Type', 'audio/wav')
      res.send(audio)
    } catch (err) {
      console.error('TTS synthesis failed:', err)
      res.status(502).json({ error: 'Failed to synthesize speech.' })
    }
  })

  return router
}
