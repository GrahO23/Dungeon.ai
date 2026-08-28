import { Router } from 'express'
import { listCharacters } from '../state/characters.js'
import { writeStory } from '../state/story.js'
import { appendTurn } from '../state/log.js'
import { generateGameIntro } from '../ollama/dm.js'

const INTRO_TURN_NUMBER = 0
const INTRO_SPEAKER = 'Dungeon Master'

export function createSetupRouter({ gameStateDir, hub, gameState }) {
  const router = Router()

  router.post('/setup/start', async (req, res) => {
    const state = gameState.get()
    if (state.sessionStatus !== 'setup') {
      return res.status(409).json({ error: 'the game has already started' })
    }

    const characters = listCharacters(gameStateDir)
    if (characters.length === 0) {
      return res.status(400).json({ error: 'at least one character is required to start' })
    }

    let intro
    try {
      intro = await generateGameIntro({ characters })
    } catch (err) {
      console.error('Failed to generate game intro:', err)
      return res.status(502).json({ error: 'The DM failed to prepare the opening scene. Please try again.' })
    }

    writeStory(
      gameStateDir,
      { status: 'playing', currentAct: 1 },
      `## Premise\n${intro.premise}\n\n## Main Quest\n${intro.mainQuest}\n\n## Active Quests\n\n## Story So Far\n- ${intro.scene}`,
    )
    appendTurn(gameStateDir, {
      turnNumber: INTRO_TURN_NUMBER,
      character: INTRO_SPEAKER,
      playerText: '',
      dmText: intro.narration,
    })

    const nextState = gameState.update({
      sessionStatus: 'playing',
      turnOrder: characters.map((c) => c.data.name),
      currentTurnIndex: 0,
      turnNumber: 0,
      currentScene: intro.scene,
    })

    hub.broadcast('session:started', nextState)
    hub.broadcast('narration:new', {
      turnNumber: INTRO_TURN_NUMBER,
      character: INTRO_SPEAKER,
      playerText: '',
      dmText: intro.narration,
    })
    res.status(200).json({ state: nextState })
  })

  return router
}
