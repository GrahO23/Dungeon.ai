import { appendTurn } from '../state/log.js'
import { applyCharacterUpdate } from '../state/characters.js'
import { appendStoryNote } from '../state/story.js'
import { applyLocationUpdate } from '../state/map.js'
import { generateTurnResponse } from '../ollama/dm.js'

export function createTurnEngine({ gameStateDir, hub, gameState }) {
  let processing = false

  function reject(ws, reason) {
    hub.send(ws, 'error:not-your-turn', { reason })
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
    hub.broadcast('turn:thinking', { character })

    try {
      const turnNumber = state.turnNumber + 1
      let narration
      let updates
      try {
        ;({ narration, updates } = await generateTurnResponse({
          character,
          action: text,
          gameStateDir,
          scene: state.currentScene,
        }))
      } catch (err) {
        console.error('DM generation failed:', err)
        // Un-stick every client's "thinking" state without advancing the turn,
        // so the same player can simply try again.
        hub.broadcast('turn:changed', { currentTurnIndex: state.currentTurnIndex, character })
        reject(ws, 'The DM had trouble responding. Please try again.')
        return
      }

      appendTurn(gameStateDir, { turnNumber, character, playerText: text, dmText: narration })

      for (const [name, update] of Object.entries(updates?.characterUpdates ?? {})) {
        applyCharacterUpdate(gameStateDir, name, update)
      }
      if (updates?.storyNote) {
        appendStoryNote(gameStateDir, updates.storyNote)
      }
      if (updates?.locationUpdate) {
        const moved = applyLocationUpdate(gameStateDir, updates.locationUpdate)
        if (!moved) {
          console.warn(`DM suggested an invalid locationUpdate: ${updates.locationUpdate}`)
        }
      }

      const nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length
      const nextScene = updates?.sceneUpdate ?? state.currentScene
      gameState.update({ currentTurnIndex: nextIndex, turnNumber, currentScene: nextScene })

      hub.broadcast('narration:new', { turnNumber, character, playerText: text, dmText: narration })
      hub.broadcast('turn:changed', {
        currentTurnIndex: nextIndex,
        character: state.turnOrder[nextIndex],
      })
    } finally {
      processing = false
    }
  }

  return { handlePlayerAction }
}
