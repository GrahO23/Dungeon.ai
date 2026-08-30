import { spawn } from 'node:child_process'
import { config } from '../config.js'
import { voicePath, voiceExists } from './voices.js'

export const MIN_SPEED = 0.5
export const MAX_SPEED = 2.0

// Piper's --length_scale is a phoneme-duration multiplier, the inverse of
// "speed" (higher length_scale = slower speech) — this does real synthesis-
// time time-stretching rather than naive audio resampling, so pitch stays
// natural at both ends of the range.
function lengthScaleFor(speed) {
  const clamped = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed))
  return (1 / clamped).toFixed(3)
}

export function synthesize(text, { voice, speed } = {}) {
  const modelPath = voiceExists(voice) ? voicePath(voice) : config.piperVoice
  const args = ['--model', modelPath, '--output_file', '-']
  if (typeof speed === 'number' && Number.isFinite(speed) && speed > 0) {
    args.push('--length_scale', lengthScaleFor(speed))
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(config.piperBin, args)

    const stdout = []
    const stderr = []

    proc.stdout.on('data', (chunk) => stdout.push(chunk))
    proc.stderr.on('data', (chunk) => stderr.push(chunk))

    proc.on('error', reject)

    proc.on('close', (code) => {
      const audio = Buffer.concat(stdout)
      if (code !== 0 || audio.length === 0) {
        reject(new Error(`piper exited with code ${code}: ${Buffer.concat(stderr).toString('utf8')}`))
        return
      }
      resolve(audio)
    })

    proc.stdin.write(text)
    proc.stdin.end()
  })
}
