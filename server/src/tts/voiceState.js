import { defaultVoiceId } from './voices.js'

// Mirrors ollama/modelState.js's pattern: one mutable shared value for the
// whole session (not per-browser) — the game is strictly turn-based, so
// every connected client hears the same narration and should hear it in the
// same voice.
let currentVoice = null
let currentSpeed = 1

export function getCurrentVoice() {
  return currentVoice ?? defaultVoiceId()
}

export function setCurrentVoice(voice) {
  currentVoice = voice
}

export function getCurrentSpeed() {
  return currentSpeed
}

export function setCurrentSpeed(speed) {
  currentSpeed = speed
}
