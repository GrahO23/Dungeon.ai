import { Router } from 'express'
import fs from 'node:fs'
import { config } from '../config.js'
import { synthesize, MIN_SPEED, MAX_SPEED } from '../tts/piper.js'
import { listVoices, voiceExists } from '../tts/voices.js'
import { getCurrentVoice, setCurrentVoice, getCurrentSpeed, setCurrentSpeed } from '../tts/voiceState.js'

const MAX_TEXT_LENGTH = 2000

// The game is strictly turn-based and single-session: every connected client
// receives the exact same narration text at the exact same moment, and (as
// of voiceState.js) synthesizes it with the same shared voice/speed. That
// means near-simultaneous /tts requests from every client are near-certain
// for every turn — this cache collapses them into one Piper invocation
// instead of one per client. It's deliberately short-lived (a few seconds,
// not a persistent cache) since narration text essentially never repeats
// across turns, so its only job is covering the "everyone asks at once"
// window, not long-term reuse.
const CACHE_TTL_MS = 5000
const cache = new Map()

function cachedSynthesize(text) {
  const existing = cache.get(text)
  if (existing) return existing

  const promise = synthesize(text, { voice: getCurrentVoice(), speed: getCurrentSpeed() })
  cache.set(text, promise)
  promise.then(
    () => setTimeout(() => cache.delete(text), CACHE_TTL_MS),
    () => cache.delete(text),
  )
  return promise
}

function ttsAvailable() {
  return config.ttsEnabled && fs.existsSync(config.piperBin)
}

export function createTtsRouter({ hub, gameState }) {
  const router = Router()

  router.get('/tts/voices', (req, res) => {
    if (!ttsAvailable()) {
      return res.status(503).json({ error: 'TTS is not available on this server.' })
    }
    res.json({ voices: listVoices(), current: getCurrentVoice(), speed: getCurrentSpeed() })
  })

  // Voice and speed are shared session state, not a per-browser preference —
  // the game is strictly turn-based, so every client hears identical
  // narration and should hear it in one consistent voice. Changeable only
  // before the game starts, same restriction and broadcast pattern as
  // routes/models.js#/models/select.
  router.post('/tts/select', (req, res) => {
    if (!ttsAvailable()) {
      return res.status(503).json({ error: 'TTS is not available on this server.' })
    }
    if (gameState.get().sessionStatus !== 'setup') {
      return res.status(409).json({ error: 'Voice can only be changed before the game starts.' })
    }

    const { voice, speed } = req.body ?? {}
    if (voice !== undefined) {
      if (typeof voice !== 'string' || !voiceExists(voice)) {
        return res.status(400).json({ error: `"${voice}" is not an available voice.` })
      }
      setCurrentVoice(voice)
    }
    if (speed !== undefined) {
      if (typeof speed !== 'number' || !Number.isFinite(speed) || speed < MIN_SPEED || speed > MAX_SPEED) {
        return res.status(400).json({ error: `speed must be a number between ${MIN_SPEED} and ${MAX_SPEED}.` })
      }
      setCurrentSpeed(speed)
    }

    const payload = { voiceId: getCurrentVoice(), voiceSpeed: getCurrentSpeed() }
    hub.broadcast('voice:changed', payload)
    res.json(payload)
  })

  router.post('/tts', async (req, res) => {
    if (!ttsAvailable()) {
      return res.status(503).json({ error: 'TTS is not available on this server.' })
    }

    const { text } = req.body ?? {}
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text is required' })
    }

    try {
      const audio = await cachedSynthesize(text.slice(0, MAX_TEXT_LENGTH))
      res.set('Content-Type', 'audio/wav')
      res.send(audio)
    } catch (err) {
      console.error('TTS synthesis failed:', err)
      res.status(502).json({ error: 'Failed to synthesize speech.' })
    }
  })

  return router
}
