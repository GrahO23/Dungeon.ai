const queue = []
let playing = false

async function playNext() {
  if (playing || queue.length === 0) return
  playing = true
  const { text, onTiming } = queue.shift()

  try {
    const startedAt = performance.now()
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`TTS request failed (${res.status})`)

    const blob = await res.blob()
    onTiming?.(Math.round(performance.now() - startedAt))
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    await new Promise((resolve) => {
      audio.addEventListener('ended', resolve, { once: true })
      audio.addEventListener('error', resolve, { once: true })
      audio.play().catch(resolve)
    })
    URL.revokeObjectURL(url)
  } catch (err) {
    console.warn('TTS playback failed, skipping:', err)
  } finally {
    playing = false
    playNext()
  }
}

export function speak(text, { onTiming } = {}) {
  if (!text?.trim()) return
  queue.push({ text, onTiming })
  playNext()
}
