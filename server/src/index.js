import express from 'express'
import { createServer } from 'node:http'
import os from 'node:os'
import { config } from './config.js'
import { pingRouter } from './routes/ping.js'
import { createCharactersRouter } from './routes/characters.js'
import { createSetupRouter } from './routes/setup.js'
import { createTtsRouter } from './routes/tts.js'
import { createModelsRouter } from './routes/models.js'
import { createScenariosRouter } from './routes/scenarios.js'
import { createHub } from './ws/hub.js'
import { listPublicCharacters } from './state/characters.js'
import { readRecentTurns, parseTurnBlock } from './state/log.js'
import { readMap, getExploredMap } from './state/map.js'
import { createGameState } from './engine/gameState.js'
import { createTurnEngine } from './engine/turnEngine.js'
import { getCurrentModel } from './ollama/modelState.js'

const app = express()
const server = createServer(app)

const gameState = createGameState(config.gameStateDir)

let turnEngine
const hub = createHub(server, {
  getSyncPayload: () => ({
    characters: listPublicCharacters(config.gameStateDir),
    ...gameState.get(),
    recentTurns: readRecentTurns(config.gameStateDir, 8).map(parseTurnBlock),
    model: getCurrentModel(),
    map: getExploredMap(readMap(config.gameStateDir).data),
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
app.use('/api', createSetupRouter({ gameStateDir: config.gameStateDir, scenariosDir: config.scenariosDir, hub, gameState }))
app.use('/api', createTtsRouter())
app.use('/api', createModelsRouter({ hub }))
app.use('/api', createScenariosRouter({ scenariosDir: config.scenariosDir }))
app.use(express.static(config.clientDistDir))

function getLanAddress() {
  for (const ifaceList of Object.values(os.networkInterfaces())) {
    for (const iface of ifaceList ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return null
}

server.listen(config.port, () => {
  const lanAddress = getLanAddress()
  console.log('Dungeon.ai server listening')
  console.log(`  Local:   http://localhost:${config.port}`)
  if (lanAddress) {
    console.log(`  Network: http://${lanAddress}:${config.port}`)
  }
})
