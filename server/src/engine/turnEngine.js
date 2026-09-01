import { appendTurn } from '../state/log.js'
import { applyCharacterUpdate, readCharacter, listPublicCharacters, slugify, tickStatusEffects as tickCharacterStatusEffects } from '../state/characters.js'
import { appendStoryNote } from '../state/story.js'
import { applyLocationUpdate, readMap, getCurrentLocation, getExploredMap } from '../state/map.js'
import { enemyExists, listPublicEnemiesHere, tickStatusEffects as tickEnemyStatusEffects } from '../state/enemies.js'
import { generateTurnResponse, narrateResolvedEvent } from '../ollama/dm.js'
import { classifyAction } from '../ollama/intent.js'
import {
  currentLocationEnemies,
  currentLocationLootableEnemies,
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

  async function narrateAndAdvance({ actorName, playerText, resolvedOutcome, narrate, turnStartedAt }) {
    const state = gameState.get()
    const turnNumber = state.turnNumber + 1

    hub.broadcast('turn:thinking', { character: actorName })

    let narration
    const llmStartedAt = Date.now()
    try {
      narration = await narrate(state)
    } catch (err) {
      console.error('DM generation failed:', err)
      // Un-stick every client's "thinking" state without advancing the turn.
      hub.broadcast('turn:changed', { currentTurnIndex: state.currentTurnIndex, character: actorName })
      return false
    }
    const llmMs = Date.now() - llmStartedAt

    appendTurn(gameStateDir, {
      turnNumber,
      character: actorName,
      playerText,
      dmText: narration.text,
      rollText: resolvedOutcome,
    })

    // The DM prompt tells the model never to hand out a defeated enemy's
    // loot on its own — that's the separate, deterministic "loot" action's
    // job (actionResolver.js) — but prompt compliance isn't guaranteed
    // (verified live: the model added a dropped item to inventory_add
    // despite the instruction, both on the defeat turn *and*, redundantly,
    // on the actor's own later loot turn, producing a duplicate). Enforce
    // it here rather than trust the model: on the defeat turn, strip any
    // inventory_add entry whose name still sits unclaimed on a lootable
    // corpse at the location; on the actor's own "Loot:" turn, the
    // deterministic resolver has *already* added exactly what should be
    // added, so suppress that actor's inventory_add entirely.
    const isLootTurn = resolvedOutcome?.startsWith('Loot:')
    const unclaimedLootNames = new Set(currentLocationLootableEnemies(gameStateDir).flatMap((e) => e.data.loot ?? []))
    for (const [name, update] of Object.entries(narration.updates?.characterUpdates ?? {})) {
      const sanitizedUpdate = Array.isArray(update.inventory_add)
        ? {
            ...update,
            inventory_add:
              isLootTurn && name === actorName
                ? []
                : update.inventory_add.filter((item) => !unclaimedLootNames.has(typeof item === 'string' ? item : item.name)),
          }
        : update
      applyCharacterUpdate(gameStateDir, name, sanitizedUpdate)
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

    // Once per the actor's own turn, not once per round — an approximation
    // given the party's round-robin turnOrder has no separate round counter.
    if (isEnemyName(gameStateDir, actorName)) {
      tickEnemyStatusEffects(gameStateDir, actorName)
    } else {
      tickCharacterStatusEffects(gameStateDir, actorName)
    }

    const { turnOrder, combatActive } = syncCombatState(state.turnOrder)
    const currentIndex = Math.max(0, turnOrder.indexOf(actorName))
    const nextIndex = turnOrder.length ? (currentIndex + 1) % turnOrder.length : 0
    const nextScene = narration.updates?.sceneUpdate ?? state.currentScene

    gameState.update({ turnOrder, combatActive, currentTurnIndex: nextIndex, turnNumber, currentScene: nextScene })

    // Every character change this turn — resolved-outcome hp/inventory deltas
    // (applied earlier, in resolvePlayerIntent/resolveEnemyTurn) and any
    // narration-driven characterUpdates (applied just above) — is already on
    // disk by this point, so a single fresh roster covers both. Without this,
    // clients only ever saw the roster from game start (routes/characters.js
    // broadcasts it once, at creation) and hp/inventory/abilities panels
    // silently went stale the moment a fight started.
    hub.broadcast('roster:updated', { characters: listPublicCharacters(gameStateDir) })
    // Same reasoning as roster:updated above — enemy hp (from a resolved
    // attack) and which enemies are even "here" (after a locationUpdate this
    // turn) both need to reach clients live, not just once at game start.
    hub.broadcast('enemies:updated', { enemies: listPublicEnemiesHere(gameStateDir) })

    hub.broadcast('narration:new', {
      turnNumber,
      character: actorName,
      playerText,
      dmText: narration.text,
      rollText: resolvedOutcome,
      llmMs,
      serverMs: Date.now() - turnStartedAt,
    })
    hub.broadcast('turn:changed', { currentTurnIndex: nextIndex, character: turnOrder[nextIndex] })
    return true
  }

  // After a player's turn (and after each enemy's own turn), keep resolving
  // enemy turns automatically — no WS message triggers these, since enemies
  // aren't connected clients — until control lands back on a real player.
  async function runEnemyTurnsUntilPlayer() {
    for (;;) {
      const turnStartedAt = Date.now()
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
        turnStartedAt,
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
    const turnStartedAt = Date.now()
    try {
      // Broadcast before the intent-classification call (itself a separate,
      // smaller LLM call — see ollama/intent.js) so players see "the DM is
      // thinking" immediately, not just once narration generation starts.
      hub.broadcast('turn:thinking', { character })

      const enemiesHere = currentLocationEnemies(gameStateDir)
      const lootableHere = currentLocationLootableEnemies(gameStateDir)
      const characterSheet = readCharacter(gameStateDir, slugify(character))
      const intent = await classifyAction({ actionText: text, character: characterSheet, enemiesHere, lootableHere })
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
        turnStartedAt,
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
