import { Router } from 'express'
import { listCharacters } from '../state/characters.js'
import { readWorld, writeWorld } from '../state/world.js'
import { readStory, writeStory } from '../state/story.js'
import { readMap, writeMap, getCurrentLocation, getExploredMap } from '../state/map.js'
import { appendTurn } from '../state/log.js'
import { generateGameIntro } from '../ollama/dm.js'
import { listEnemies, writeEnemy, listPublicEnemiesHere } from '../state/enemies.js'
import { slugify } from '../state/characters.js'
import { scenarioDir, scenarioExists } from '../state/scenarios.js'
import { getSection, removeSection } from '../state/sections.js'

const INTRO_TURN_NUMBER = 0
const INTRO_SPEAKER = 'Dungeon Master'

function bulletList(items, fallback) {
  const list = items?.length ? items : [fallback]
  return list.map((item) => `- ${item}`).join('\n')
}

// Fails soft: if the model didn't produce a valid, connected map, fall back
// to a single starting location rather than leaving map.md empty.
function resolveMap(intro) {
  const locations = intro.locations?.length ? intro.locations : []
  const startLocationId = locations.some((loc) => loc.id === intro.startLocationId)
    ? intro.startLocationId
    : locations[0]?.id

  if (!startLocationId) {
    return {
      currentLocationId: 'starting-point',
      locations: [
        {
          id: 'starting-point',
          name: 'Starting Point',
          description: intro.scene || 'Where the adventure begins.',
          connectsTo: [],
          questHook: '',
        },
      ],
    }
  }

  return { currentLocationId: startLocationId, locations }
}

export function createSetupRouter({ gameStateDir, scenariosDir, hub, gameState }) {
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

    hub.broadcast('setup:started', {})

    let intro
    try {
      intro = await generateGameIntro({ characters })
    } catch (err) {
      console.error('Failed to generate game intro:', err)
      const error = 'The DM failed to prepare the opening scene. Please try again.'
      hub.broadcast('setup:failed', { error })
      return res.status(502).json({ error })
    }

    writeWorld(
      gameStateDir,
      { title: intro.title || 'Untitled World' },
      `## Setting\n${intro.setting || '(not established)'}\n\n` +
        `## Factions\n${bulletList(intro.factions, '(not established)')}`,
    )

    const map = resolveMap(intro)
    writeMap(gameStateDir, map)

    const validLocationIds = new Set(map.locations.map((loc) => loc.id))
    for (const npc of intro.npcs ?? []) {
      if (!npc.name || !validLocationIds.has(npc.locationId)) continue
      const { name, ...rest } = npc
      writeEnemy(gameStateDir, slugify(name), { name, ...rest })
    }

    writeStory(
      gameStateDir,
      { status: 'playing', currentAct: 1 },
      `## Premise\n${intro.premise}\n\n` +
        `## Main Quest\n${intro.mainQuest}\n\n` +
        `## Active Quests\n\n` +
        `## DM Plan\n${bulletList(intro.plan, '(not established)')}\n\n` +
        `## Story So Far\n- ${intro.scene}`,
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

    hub.broadcast('session:started', {
      ...nextState,
      map: getExploredMap(readMap(gameStateDir).data),
      enemies: listPublicEnemiesHere(gameStateDir),
    })
    hub.broadcast('narration:new', {
      turnNumber: INTRO_TURN_NUMBER,
      character: INTRO_SPEAKER,
      playerText: '',
      dmText: intro.narration,
    })
    res.status(200).json({ state: nextState })
  })

  router.post('/setup/start-scenario', (req, res) => {
    const state = gameState.get()
    if (state.sessionStatus !== 'setup') {
      return res.status(409).json({ error: 'the game has already started' })
    }

    const characters = listCharacters(gameStateDir)
    if (characters.length === 0) {
      return res.status(400).json({ error: 'at least one character is required to start' })
    }

    const { slug } = req.body ?? {}
    if (typeof slug !== 'string' || !scenarioExists(scenariosDir, slug)) {
      return res.status(404).json({ error: `no such scenario: ${slug}` })
    }

    hub.broadcast('setup:started', {})

    try {
      const sourceDir = scenarioDir(scenariosDir, slug)

      const world = readWorld(sourceDir)
      writeWorld(gameStateDir, { title: world.data.title }, world.content)

      const map = readMap(sourceDir).data
      writeMap(gameStateDir, { currentLocationId: map.currentLocationId, locations: map.locations })

      const story = readStory(sourceDir)
      const openingNarration =
        getSection(story.content, 'Opening Narration') || 'Welcome, adventurers. Your journey begins.'
      writeStory(
        gameStateDir,
        { ...story.data, status: 'playing' },
        removeSection(story.content, 'Opening Narration'),
      )

      for (const enemy of listEnemies(sourceDir)) {
        writeEnemy(gameStateDir, enemy.slug, enemy.data, enemy.content)
      }

      const startScene = getCurrentLocation(map)?.description || ''

      appendTurn(gameStateDir, {
        turnNumber: INTRO_TURN_NUMBER,
        character: INTRO_SPEAKER,
        playerText: '',
        dmText: openingNarration,
      })

      const nextState = gameState.update({
        sessionStatus: 'playing',
        turnOrder: characters.map((c) => c.data.name),
        currentTurnIndex: 0,
        turnNumber: 0,
        currentScene: startScene,
      })

      hub.broadcast('session:started', {
        ...nextState,
        map: getExploredMap(readMap(gameStateDir).data),
        enemies: listPublicEnemiesHere(gameStateDir),
      })
      hub.broadcast('narration:new', {
        turnNumber: INTRO_TURN_NUMBER,
        character: INTRO_SPEAKER,
        playerText: '',
        dmText: openingNarration,
      })
      res.status(200).json({ state: nextState })
    } catch (err) {
      console.error('Failed to load scenario:', err)
      const error = 'Failed to load the scenario. Please try again.'
      hub.broadcast('setup:failed', { error })
      res.status(500).json({ error })
    }
  })

  return router
}
