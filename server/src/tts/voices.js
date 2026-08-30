import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'

function voicesDir() {
  return path.join(path.dirname(config.piperBin), 'voices')
}

// Every .onnx file in vendor/piper/voices/ that has a matching .onnx.json
// config alongside it — that pairing is what Piper itself requires, so it
// doubles as "is this actually a usable voice" validation.
export function listVoices() {
  const dir = voicesDir()
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.onnx'))
    .map((f) => f.replace(/\.onnx$/, ''))
    .filter((id) => fs.existsSync(path.join(dir, `${id}.onnx.json`)))
    .sort()
    .map((id) => ({ id }))
}

export function voicePath(id) {
  return path.join(voicesDir(), `${id}.onnx`)
}

export function voiceExists(id) {
  return Boolean(id) && fs.existsSync(voicePath(id)) && fs.existsSync(`${voicePath(id)}.json`)
}

export function defaultVoiceId() {
  return path.basename(config.piperVoice, '.onnx')
}
