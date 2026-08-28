import { config } from '../config.js'
import { getCurrentModel } from './modelState.js'

export async function generate({ model = getCurrentModel(), system, prompt, options }) {
  const res = await fetch(`${config.ollamaHost}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, system, prompt, stream: false, options }),
  })

  if (!res.ok) {
    throw new Error(`Ollama request failed (${res.status}): ${await res.text()}`)
  }

  const data = await res.json()
  return data.response
}

export async function listModels() {
  const res = await fetch(`${config.ollamaHost}/api/tags`)
  if (!res.ok) {
    throw new Error(`Failed to list Ollama models (${res.status}): ${await res.text()}`)
  }

  const data = await res.json()
  return (data.models ?? []).map((m) => ({
    name: m.name,
    parameterSize: m.details?.parameter_size ?? null,
    family: m.details?.family ?? null,
  }))
}
