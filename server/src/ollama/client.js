import { config } from '../config.js'

export async function generate({ model = config.ollamaModel, system, prompt }) {
  const res = await fetch(`${config.ollamaHost}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, system, prompt, stream: false }),
  })

  if (!res.ok) {
    throw new Error(`Ollama request failed (${res.status}): ${await res.text()}`)
  }

  const data = await res.json()
  return data.response
}
