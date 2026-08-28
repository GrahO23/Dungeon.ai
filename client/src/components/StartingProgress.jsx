import { useEffect, useState } from 'react'

// The server makes one Ollama call that produces the world, map, story, and
// opening scene together (~10-20s) — there's no real per-step signal to
// report, so this cycles flavor text on a timer purely to show the wait is
// progressing, then holds on the last line if it runs long.
const STAGES = [
  'Conjuring a setting…',
  'Charting the map…',
  'Weaving the story…',
  'Setting the opening scene…',
  'Almost ready…',
]
const STAGE_INTERVAL_MS = 4000

export function StartingProgress() {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1))
    }, STAGE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="starting-progress">
      <p className="starting-progress-stage">{STAGES[stageIndex]}</p>
      <p className="starting-progress-hint">The DM is preparing the adventure — this can take up to 20 seconds.</p>
    </div>
  )
}
