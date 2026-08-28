import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

export const config = {
  port: Number(process.env.PORT) || 3001,
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:14b',
  gameStateDir: process.env.GAME_STATE_DIR || path.join(repoRoot, 'game-state'),
  clientDistDir: path.join(repoRoot, 'client', 'dist'),
}
