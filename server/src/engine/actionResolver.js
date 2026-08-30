import { readCharacter, applyCharacterUpdate, slugify } from '../state/characters.js'
import { listEnemiesAtLocation, readEnemy, applyEnemyUpdate } from '../state/enemies.js'
import { readMap, getCurrentLocation } from '../state/map.js'
import { resolveAttack } from '../rules/combat.js'
import { resolveSkillCheck, skillModifier, difficultyToDC } from '../rules/checks.js'

function itemName(item) {
  return typeof item === 'string' ? item : item.name
}

function findByName(items, name, getName) {
  if (!name) return null
  const needle = name.trim().toLowerCase()
  if (!needle) return null
  return (
    items.find((item) => {
      const candidate = getName(item).toLowerCase()
      return candidate.includes(needle) || needle.includes(candidate)
    }) ?? null
  )
}

export function currentLocationEnemies(gameStateDir) {
  const map = readMap(gameStateDir).data
  const current = getCurrentLocation(map)
  if (!current) return []
  return listEnemiesAtLocation(gameStateDir, current.id)
}

export function livingHostileEnemyNames(gameStateDir, locationId) {
  return listEnemiesAtLocation(gameStateDir, locationId)
    .filter((e) => e.data.hostile !== false)
    .map((e) => e.data.name)
}

// Deterministically resolves a classified player intent (attack, skill-check,
// item-use) against the rules engine, applying any resulting state change
// itself. Returns null when there's nothing deterministic to resolve — the
// intent type doesn't need it, or a named target/item couldn't be found —
// and the caller falls back to the LLM's own free-form narration.
export function resolvePlayerIntent({ gameStateDir, characterName, intent }) {
  const characterSheet = readCharacter(gameStateDir, slugify(characterName))

  if (intent.type === 'attack') {
    const enemies = currentLocationEnemies(gameStateDir)
    const target = findByName(enemies, intent.target, (e) => e.data.name)
    if (!target) return null

    const result = resolveAttack({ attacker: characterSheet.data, defender: target.data })
    applyEnemyUpdate(gameStateDir, target.data.name, { hp: result.hit ? -result.damage : 0 })
    const remainingHp = Math.max(0, target.data.hp - (result.hit ? result.damage : 0))
    const defeated = result.hit && remainingHp <= 0
    const lootText = defeated && target.data.loot?.length ? ` It drops: ${target.data.loot.join(', ')}.` : ''

    const outcome = result.fumble
      ? `Combat: ${characterName} attacks ${target.data.name} with their ${result.weapon} — rolled a natural 1: FUMBLE, automatic miss.`
      : `Combat: ${characterName} attacks ${target.data.name} with their ${result.weapon} — rolled ${result.total} vs AC ${result.targetAC}: ${result.hit ? `HIT for ${result.damage} damage` : 'MISS'}.${defeated ? ` ${target.data.name} is defeated!${lootText}` : ''}`

    return { resolvedOutcome: outcome }
  }

  if (intent.type === 'skill-check') {
    const modifier = skillModifier(characterSheet.data, intent.skill)
    const dc = difficultyToDC(intent.difficulty)
    const result = resolveSkillCheck({ modifier, dc })
    const outcome = `Skill Check: ${characterName} attempts ${intent.skill || 'a check'} (DC ${dc}) — rolled ${result.roll}+${modifier}=${result.total}: ${result.success ? 'SUCCESS' : 'FAILURE'}.`
    return { resolvedOutcome: outcome }
  }

  if (intent.type === 'item-use') {
    const item = findByName(characterSheet.data.inventory ?? [], intent.item, itemName)
    if (!item || typeof item === 'string' || item.type !== 'consumable') return null

    const effectHp = item.effect?.hp ?? 0
    applyCharacterUpdate(gameStateDir, characterName, {
      inventory_remove: [{ name: item.name, qty: 1 }],
      hp: effectHp,
    })
    const outcome = `Item Use: ${characterName} uses ${item.name}${effectHp ? ` and recovers ${effectHp} HP` : ''}.`
    return { resolvedOutcome: outcome }
  }

  return null
}

// Auto-resolves a hostile enemy's turn: it attacks a random living party
// member. No LLM call is used for the decision — only for narrating it
// afterwards (see ollama/dm.js#narrateResolvedEvent).
export function resolveEnemyTurn({ gameStateDir, enemyName, partyNames }) {
  const enemySheet = readEnemy(gameStateDir, slugify(enemyName))
  const livingParty = partyNames
    .map((name) => ({ name, sheet: readCharacter(gameStateDir, slugify(name)) }))
    .filter(({ sheet }) => (sheet.data.hp ?? 0) > 0)

  if (!livingParty.length) return null
  const target = livingParty[Math.floor(Math.random() * livingParty.length)]

  const result = resolveAttack({ attacker: enemySheet.data, defender: target.sheet.data })
  applyCharacterUpdate(gameStateDir, target.name, { hp: result.hit ? -result.damage : 0 })

  const outcome = result.fumble
    ? `Combat: ${enemyName} attacks ${target.name} — rolled a natural 1: FUMBLE, automatic miss.`
    : `Combat: ${enemyName} attacks ${target.name} — rolled ${result.total} vs AC ${result.targetAC}: ${result.hit ? `HIT for ${result.damage} damage` : 'MISS'}.`

  return { resolvedOutcome: outcome, targetName: target.name }
}
