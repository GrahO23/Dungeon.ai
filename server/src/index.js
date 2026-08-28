import express from 'express'
import { createServer } from 'node:http'
import { config } from './config.js'
import { pingRouter } from './routes/ping.js'
import { createCharactersRouter } from './routes/characters.js'
import { createSetupRouter } from './routes/setup.js'
import { createHub } from './ws/hub.js'
import { listPublicCharacters } from './state/characters.js'
import { readRecentTurns, parseTurnBlock } from './state/log.js'
import { createGameState } from './engine/gameState.js'
import { createTurnEngine } from './engine/turnEngine.js'

const app = express()
const server = createServer(app)

const gameState = createGameState(config.gameStateDir)

let turnEngine
const hub = createHub(server, {
  getSyncPayload: () => ({
    characters: listPublicCharacters(config.gameStateDir),
    ...gameState.get(),
    recentTurns: readRecentTurns(config.gameStateDir, 8).map(parseTurnBlock),
  }),
  onMessage: (ws, msg) => {
    if (msg?.type === 'player:action') {
      turnEngine.handlePlayerAction(ws, msg.payload)
    }
  },
})
turnEngine = createTurnEngine({ gameStateDir: config.gameStateDir, hub, gameState })

app.use(express.json())
app.use('/api', pingRouter)
app.use('/api', createCharactersRouter({ gameStateDir: config.gameStateDir, hub }))
app.use('/api', createSetupRouter({ gameStateDir: config.gameStateDir, hub, gameState }))
app.use(express.static(config.clientDistDir))

server.listen(config.port, () => {
  console.log(`Dungeon.ai server listening on http://localhost:${config.port}`)
})
