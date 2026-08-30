import { appendTurn } from '../state/log.js'
import { applyCharacterUpdate, readCharacter, slugify } from '../state/characters.js'
import { appendStoryNote } from '../state/story.js'
import { applyLocationUpdate, readMap, getCurrentLocation, getExploredMap } from '../state/map.js'
import { enemyExists } from '../state/enemies.js'
import { generateTurnResponse, narrateResolvedEvent } from '../ollama/dm.js'
import { classifyAction } from '../ollama/intent.js'
import {
  currentLocationEnemies,
  livingHostileEnemyNames,
  resolvePlayerIntent,
  resolveEnemyTurn,
} from './actionResolver.js'

function isEnemyName(gameStateDir, name) {
  return enemyExists(gameStateDir, slugify(name))
}

export function createTurnEngine({ gameStateDir, hub, gameState }) {
  let processing = false

  function reject(ws, reason) {
    hub.send(ws, 'error:not-your-turn', { reason })
  }

  // Splices any living hostile enemies at the party's current location into
  // turnOrder (starting/continuing combat) or drops them back out once none
  // remain (ending it). Party order and relative positions are untouched —
  // enemies are simply appended, reusing the existing round-robin engine
  // rather than a separate initiative system.
  function syncCombatState(turnOrder) {
    const map = readMap(gameStateDir).data
    const current = getCurrentLocation(map)
    const hostileNames = current ? livingHostileEnemyNames(gameStateDir, current.id) : []
    const partyNames = turnOrder.filter((name) => !isEnemyName(gameStateDir, name))

    return { turnOrder: [...partyNames, ...hostileNames], combatActive: hostileNames.length > 0 }
  }

  async function narrateAndAdvance({ actorName, playerText, resolvedOutcome, narrate }) {
    const state = gameState.get()
    const turnNumber = state.turnNumber + 1

    hub.broadcast('turn:thinking', { character: actorName })

    let narration
    try {
      narration = await narrate(state)
    } catch (err) {
      console.error('DM generation failed:', err)
      // Un-stick every client's "thinking" state without advancing the turn.
      hub.broadcast('turn:changed', { currentTurnIndex: state.currentTurnIndex, character: actorName })
      return false
    }

    appendTurn(gameStateDir, {
      turnNumber,
      character: actorName,
      playerText,
      dmText: narration.text,
      rollText: resolvedOutcome,
    })

    for (const [name, update] of Object.entries(narration.updates?.characterUpdates ?? {})) {
      applyCharacterUpdate(gameStateDir, name, update)
    }
    if (narration.updates?.storyNote) {
      appendStoryNote(gameStateDir, narration.updates.storyNote)
    }
    if (narration.updates?.locationUpdate) {
      const moved = applyLocationUpdate(gameStateDir, narration.updates.locationUpdate)
      if (moved) {
        hub.broadcast('map:updated', getExploredMap(readMap(gameStateDir).data))
      } else {
        console.warn(`DM suggested an invalid locationUpdate: ${narration.updates.locationUpdate}`)
      }
    }

    const { turnOrder, combatActive } = syncCombatState(state.turnOrder)
    const currentIndex = Math.max(0, turnOrder.indexOf(actorName))
    const nextIndex = turnOrder.length ? (currentIndex + 1) % turnOrder.length : 0
    const nextScene = narration.updates?.sceneUpdate ?? state.currentScene

    gameState.update({ turnOrder, combatActive, currentTurnIndex: nextIndex, turnNumber, currentScene: nextScene })

    hub.broadcast('narration:new', {
      turnNumber,
      character: actorName,
      playerText,
      dmText: narration.text,
      rollText: resolvedOutcome,
    })
    hub.broadcast('turn:changed', { currentTurnIndex: nextIndex, character: turnOrder[nextIndex] })
    return true
  }

  // After a player's turn (and after each enemy's own turn), keep resolving
  // enemy turns automatically — no WS message triggers these, since enemies
  // aren't connected clients — until control lands back on a real player.
  async function runEnemyTurnsUntilPlayer() {
    for (;;) {
      const state = gameState.get()
      const actorName = state.turnOrder[state.currentTurnIndex]
      if (!actorName || !isEnemyName(gameStateDir, actorName)) return

      const partyNames = state.turnOrder.filter((name) => !isEnemyName(gameStateDir, name))
      const resolved = resolveEnemyTurn({ gameStateDir, enemyName: actorName, partyNames })
      if (!resolved) return // no living party member left to target

      const ok = await narrateAndAdvance({
        actorName,
        playerText: '',
        resolvedOutcome: resolved.resolvedOutcome,
        narrate: async (currentState) => ({
          text: await narrateResolvedEvent({ scene: currentState.currentScene, resolvedOutcome: resolved.resolvedOutcome }),
          updates: {},
        }),
      })
      if (!ok) return
    }
  }

  async function handlePlayerAction(ws, { character, text } = {}) {
    if (!character || typeof text !== 'string' || !text.trim()) {
      return reject(ws, 'A character and action text are required.')
    }
    if (processing) {
      return reject(ws, 'The DM is still responding to the previous turn.')
    }

    const state = gameState.get()
    if (state.sessionStatus !== 'playing') {
      return reject(ws, 'The game has not started yet.')
    }
    const currentCharacter = state.turnOrder[state.currentTurnIndex]
    if (currentCharacter !== character) {
      return reject(ws, `It is ${currentCharacter}'s turn, not yours.`)
    }

    processing = true
    try {
      const enemiesHere = currentLocationEnemies(gameStateDir)
      const characterSheet = readCharacter(gameStateDir, slugify(character))
      const intent = await classifyAction({ actionText: text, character: characterSheet, enemiesHere })
      const resolved = resolvePlayerIntent({ gameStateDir, characterName: character, intent })

      const ok = await narrateAndAdvance({
        actorName: character,
        playerText: text,
        resolvedOutcome: resolved?.resolvedOutcome ?? null,
        narrate: async (currentState) => {
          const { narration, updates } = await generateTurnResponse({
            character,
            action: text,
            gameStateDir,
            scene: currentState.currentScene,
            resolvedOutcome: resolved?.resolvedOutcome ?? null,
          })
          return { text: narration, updates }
        },
      })
      if (!ok) {
        return reject(ws, 'The DM had trouble responding. Please try again.')
      }

      await runEnemyTurnsUntilPlayer()
    } finally {
      processing = false
    }
  }

  return { handlePlayerAction }
}
