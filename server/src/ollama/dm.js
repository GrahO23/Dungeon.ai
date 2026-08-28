// Stub DM for milestone 4 — proves the turn engine before real Ollama calls
// (and their latency/unreliability) enter the picture. Milestone 5 replaces
// the body of generateTurnResponse with a real Ollama call + structured
// JSON-block parsing, keeping this same { narration, updates } return shape.
export async function generateTurnResponse({ character, action }) {
  const narration = `${character} attempts to: "${action}". The DM nods and the story continues...`
  return { narration, updates: {} }
}
