import { Router } from 'express'
import { listPublicCharacters } from '../state/characters.js'

export function createSetupRouter({ gameStateDir, hub, gameState }) {
  const router = Router()

  router.post('/setup/start', (req, res) => {
    const state = gameState.get()
    if (state.sessionStatus !== 'setup') {
      return res.status(409).json({ error: 'the game has already started' })
    }

    const roster = listPublicCharacters(gameStateDir)
    if (roster.length === 0) {
      return res.status(400).json({ error: 'at least one character is required to start' })
    }

    const nextState = gameState.update({
      sessionStatus: 'playing',
      turnOrder: roster.map((c) => c.name),
      currentTurnIndex: 0,
      turnNumber: 0,
      currentScene: 'The adventure begins.',
    })

    hub.broadcast('session:started', nextState)
    res.status(200).json({ state: nextState })
  })

  return router
}
