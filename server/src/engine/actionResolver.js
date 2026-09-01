import { readCharacter, applyCharacterUpdate, slugify } from '../state/characters.js'
import { listEnemiesAtLocation, listLootableEnemiesAtLocation, readEnemy, applyEnemyUpdate } from '../state/enemies.js'
import { readMap, getCurrentLocation, getLocation } from '../state/map.js'
import { resolveAttack } from '../rules/combat.js'
import { resolveSkillCheck, skillModifier, difficultyToDC } from '../rules/checks.js'
import { resolveSpellAttack, resolveSpellSave, applyDamageType } from '../rules/spells.js'
import { STATUS_EFFECT_MODIFIERS } from '../rules/constants.js'

// Combines an actor's own status effects (disadvantage/bonus on their own
// roll) with their opponent's (which may grant the actor advantage instead
// — e.g. attacking a restrained or stunned target) into the single
// {advantage, disadvantage, bonus} triple rules/combat.js#resolveAttack and
// rules/spells.js expect. `opponent` is optional (skill checks have none).
// Status names with no STATUS_EFFECT_MODIFIERS entry are silently ignored
// — cosmetic-only, by design.
function combinedModifiers(actor, opponent) {
  let advantage = false
  let disadvantage = false
  let bonus = 0

  for (const effect of actor?.statusEffects ?? []) {
    const mod = STATUS_EFFECT_MODIFIERS[effect.name]
    if (!mod) continue
    if (mod.selfDisadvantage) disadvantage = true
    if (mod.selfBonus) bonus += mod.selfBonus
  }
  for (const effect of opponent?.statusEffects ?? []) {
    if (STATUS_EFFECT_MODIFIERS[effect.name]?.opponentAdvantage) advantage = true
  }

  return { advantage, disadvantage, bonus }
}

// The name of the first status effect that skips this entity's turn
// entirely (stunned today), or null if none applies.
function skipTurnStatus(entity) {
  const effect = (entity?.statusEffects ?? []).find((e) => STATUS_EFFECT_MODIFIERS[e.name]?.skipsTurn)
  return effect?.name ?? null
}

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

export function currentLocationLootableEnemies(gameStateDir) {
  const map = readMap(gameStateDir).data
  const current = getCurrentLocation(map)
  if (!current) return []
  return listLootableEnemiesAtLocation(gameStateDir, current.id)
}

export function livingHostileEnemyNames(gameStateDir, locationId) {
  return listEnemiesAtLocation(gameStateDir, locationId)
    .filter((e) => e.data.hostile !== false)
    .map((e) => e.data.name)
}

// Applies a resolved amount of damage to an enemy and builds the shared
// "defeated" tail used by both the weapon-attack and spellcasting outcomes.
function applyDamageToEnemy(gameStateDir, target, damage) {
  applyEnemyUpdate(gameStateDir, target.data.name, { hp: damage ? -damage : 0 })
  const remainingHp = Math.max(0, target.data.hp - damage)
  const defeated = damage > 0 && remainingHp <= 0
  const lootText = defeated && target.data.loot?.length ? ` It drops: ${target.data.loot.join(', ')}.` : ''
  return defeated ? ` ${target.data.name} is defeated!${lootText}` : ''
}

// Resolves an "attack" intent that named one of the caster's own offensive
// abilities (ability.resolution is 'attack' or 'save' — see
// rules/constants.js#CLASS_STARTING_ABILITIES) instead of the character's
// equipped weapon. Cantrips (level 0) are always available; leveled spells
// consume a spell slot, and fizzle with no roll if none remain.
function resolveSpellIntent({ gameStateDir, characterName, characterSheet, target, ability }) {
  const level = ability.level || 0
  if (level > 0) {
    const slot = characterSheet.data.spellSlots?.[level]
    if (!slot || slot.current <= 0) {
      return {
        resolvedOutcome: `Spell: ${characterName} tries to cast ${ability.name} but has no level ${level} spell slots remaining — it fizzles.`,
      }
    }
    applyCharacterUpdate(gameStateDir, characterName, { spellSlots: { [level]: -1 } })
  }

  if (ability.resolution === 'save') {
    // A saving throw has no "opponent grants advantage" concept the way an
    // attack roll does — only the defender's own statusEffects matter here
    // (they're the one rolling it — see rules/spells.js#resolveSpellSave).
    const mods = combinedModifiers(target.data, null)
    const result = resolveSpellSave({ caster: characterSheet.data, defender: target.data, ability, ...mods })
    const defeatedText = applyDamageToEnemy(gameStateDir, target, result.damage)
    const outcome = `Spell: ${characterName} casts ${ability.name} at ${target.data.name} — target ${result.success ? 'succeeds' : 'fails'} a DC ${result.dc} save: ${result.damage} ${result.damageType} damage${result.success ? ' (halved)' : ''}.${defeatedText}`
    return { resolvedOutcome: outcome }
  }

  const mods = combinedModifiers(characterSheet.data, target.data)
  const result = resolveSpellAttack({ caster: characterSheet.data, defender: target.data, ability, ...mods })
  const defeatedText = applyDamageToEnemy(gameStateDir, target, result.hit ? result.damage : 0)
  const outcome = result.fumble
    ? `Spell: ${characterName} casts ${ability.name} at ${target.data.name} — rolled a natural 1: FUMBLE, automatic miss.`
    : `Spell: ${characterName} casts ${ability.name} at ${target.data.name} — rolled ${result.total} vs AC ${result.targetAC}: ${result.hit ? `HIT for ${result.damage} ${result.damageType} damage` : 'MISS'}.${defeatedText}`
  return { resolvedOutcome: outcome }
}

// Deterministically resolves a classified player intent (attack, skill-check,
// item-use, rest) against the rules engine, applying any resulting state
// change itself. Returns null when there's nothing deterministic to resolve
// — the intent type doesn't need it, or a named target/item couldn't be
// found — and the caller falls back to the LLM's own free-form narration.
export function resolvePlayerIntent({ gameStateDir, characterName, intent }) {
  const characterSheet = readCharacter(gameStateDir, slugify(characterName))

  const stunStatus = skipTurnStatus(characterSheet.data)
  if (stunStatus) {
    return { resolvedOutcome: `Status: ${characterName} is ${stunStatus} and can't act this turn.` }
  }

  if (intent.type === 'attack') {
    const enemies = currentLocationEnemies(gameStateDir)
    const target = findByName(enemies, intent.target, (e) => e.data.name)
    if (!target) return null

    const ability = findByName(characterSheet.data.abilities ?? [], intent.ability, (a) => a.name)
    if (ability?.resolution) {
      return resolveSpellIntent({ gameStateDir, characterName, characterSheet, target, ability })
    }

    const mods = combinedModifiers(characterSheet.data, target.data)
    const result = resolveAttack({ attacker: characterSheet.data, defender: target.data, ...mods })
    const damage = applyDamageType(result.hit ? result.damage : 0, 'physical', target.data)
    const defeatedText = applyDamageToEnemy(gameStateDir, target, damage)

    const outcome = result.fumble
      ? `Combat: ${characterName} attacks ${target.data.name} with their ${result.weapon} — rolled a natural 1: FUMBLE, automatic miss.`
      : `Combat: ${characterName} attacks ${target.data.name} with their ${result.weapon} — rolled ${result.total} vs AC ${result.targetAC}: ${result.hit ? `HIT for ${damage} damage` : 'MISS'}.${defeatedText}`

    return { resolvedOutcome: outcome }
  }

  if (intent.type === 'skill-check') {
    const mods = combinedModifiers(characterSheet.data, null)
    const modifier = skillModifier(characterSheet.data, intent.skill) + mods.bonus
    const dc = difficultyToDC(intent.difficulty)
    const result = resolveSkillCheck({ modifier, dc, advantage: mods.advantage, disadvantage: mods.disadvantage })
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

  if (intent.type === 'loot') {
    const lootable = currentLocationLootableEnemies(gameStateDir)
    const target = findByName(lootable, intent.target, (e) => e.data.name)
    if (!target) return null

    const items = target.data.loot
    applyCharacterUpdate(gameStateDir, characterName, { inventory_add: items })
    applyEnemyUpdate(gameStateDir, target.data.name, { loot: [] })

    const outcome = `Loot: ${characterName} searches ${target.data.name} and finds: ${items.join(', ')}.`
    return { resolvedOutcome: outcome }
  }

  if (intent.type === 'rest') {
    const slots = characterSheet.data.spellSlots ?? {}
    const restoreDelta = Object.fromEntries(
      Object.entries(slots)
        .filter(([, slot]) => slot.current < slot.max)
        .map(([level, slot]) => [level, slot.max - slot.current]),
    )
    if (Object.keys(restoreDelta).length) {
      applyCharacterUpdate(gameStateDir, characterName, { spellSlots: restoreDelta })
    }
    const outcome = Object.keys(slots).length
      ? `Rest: ${characterName} rests and recovers all spell slots.`
      : `Rest: ${characterName} takes a moment to rest and recover.`
    return { resolvedOutcome: outcome }
  }

  return null
}

const FLEE_HP_FRACTION = 0.25
const DEFAULT_ENEMY_SPELL_USES = 2

// Ties broken randomly rather than by turnOrder position, so the "weakest
// target" heuristic doesn't become a predictable "first party member" one
// whenever several are at the same HP (most visibly at full HP, turn one).
function lowestHpTarget(livingParty) {
  const minHp = Math.min(...livingParty.map((p) => p.sheet.data.hp))
  const lowest = livingParty.filter((p) => p.sheet.data.hp === minHp)
  return lowest[Math.floor(Math.random() * lowest.length)]
}

// Moves a fleeing enemy to a random location connected to its current one,
// dropping it out of combat — turnEngine.js#syncCombatState only pulls
// hostiles in at the party's *current* location, so relocating it ends its
// turnOrder participation without any other bookkeeping. No-op (the enemy
// stays and fights) if it has nowhere to flee to.
function fleeToConnectedLocation(gameStateDir, enemySheet) {
  const map = readMap(gameStateDir).data
  const here = getLocation(map, enemySheet.data.locationId)
  const options = here?.connectsTo ?? []
  if (!options.length) return false

  const destination = options[Math.floor(Math.random() * options.length)]
  applyEnemyUpdate(gameStateDir, enemySheet.data.name, { locationId: destination })
  return true
}

// Picks an offensive ability for the enemy to cast instead of a plain
// weapon attack — only possible if it has any (opt-in via state/enemies.js'
// optional `abilities` field) and hasn't exhausted its uses (a flat counter,
// not per-level slots like player casters — enemies don't rest). A coin
// flip keeps weapon attacks in the mix instead of always preferring magic.
function pickEnemyAbility(enemyData) {
  const abilities = (enemyData.abilities ?? []).filter((a) => a.resolution)
  if (!abilities.length) return null
  const usesRemaining = enemyData.spellUsesRemaining ?? DEFAULT_ENEMY_SPELL_USES
  if (usesRemaining <= 0 || Math.random() < 0.5) return null
  return abilities[Math.floor(Math.random() * abilities.length)]
}

function resolveEnemySpell({ gameStateDir, enemySheet, target, ability }) {
  const enemyName = enemySheet.data.name
  const usesRemaining = enemySheet.data.spellUsesRemaining ?? DEFAULT_ENEMY_SPELL_USES
  applyEnemyUpdate(gameStateDir, enemyName, { spellUsesRemaining: usesRemaining - 1 })

  if (ability.resolution === 'save') {
    const mods = combinedModifiers(target.sheet.data, null)
    const result = resolveSpellSave({ caster: enemySheet.data, defender: target.sheet.data, ability, ...mods })
    applyCharacterUpdate(gameStateDir, target.name, { hp: -result.damage })
    const outcome = `Spell: ${enemyName} casts ${ability.name} at ${target.name} — target ${result.success ? 'succeeds' : 'fails'} a DC ${result.dc} save: ${result.damage} ${result.damageType} damage${result.success ? ' (halved)' : ''}.`
    return { resolvedOutcome: outcome, targetName: target.name }
  }

  const mods = combinedModifiers(enemySheet.data, target.sheet.data)
  const result = resolveSpellAttack({ caster: enemySheet.data, defender: target.sheet.data, ability, ...mods })
  applyCharacterUpdate(gameStateDir, target.name, { hp: result.hit ? -result.damage : 0 })
  const outcome = result.fumble
    ? `Spell: ${enemyName} casts ${ability.name} at ${target.name} — rolled a natural 1: FUMBLE, automatic miss.`
    : `Spell: ${enemyName} casts ${ability.name} at ${target.name} — rolled ${result.total} vs AC ${result.targetAC}: ${result.hit ? `HIT for ${result.damage} ${result.damageType} damage` : 'MISS'}.`
  return { resolvedOutcome: outcome, targetName: target.name }
}

// Auto-resolves a hostile enemy's turn. Flees to a connected location
// instead of fighting once badly hurt (fleeToConnectedLocation); otherwise
// targets the lowest-HP living party member (lowestHpTarget) and either
// casts an offensive ability (pickEnemyAbility) or falls back to a plain
// weapon attack. No LLM call is used for the decision — only for narrating
// it afterwards (see ollama/dm.js#narrateResolvedEvent).
export function resolveEnemyTurn({ gameStateDir, enemyName, partyNames }) {
  const enemySheet = readEnemy(gameStateDir, slugify(enemyName))
  const livingParty = partyNames
    .map((name) => ({ name, sheet: readCharacter(gameStateDir, slugify(name)) }))
    .filter(({ sheet }) => (sheet.data.hp ?? 0) > 0)

  if (!livingParty.length) return null

  const stunStatus = skipTurnStatus(enemySheet.data)
  if (stunStatus) {
    return { resolvedOutcome: `Status: ${enemyName} is ${stunStatus} and can't act this turn.`, targetName: null }
  }

  const maxHp = enemySheet.data.maxHp ?? enemySheet.data.hp ?? 0
  const badlyHurt = maxHp > 0 && enemySheet.data.hp / maxHp <= FLEE_HP_FRACTION
  if (badlyHurt && fleeToConnectedLocation(gameStateDir, enemySheet)) {
    return { resolvedOutcome: `Combat: ${enemyName}, badly wounded, breaks off and flees.`, targetName: null }
  }

  const target = lowestHpTarget(livingParty)

  const ability = pickEnemyAbility(enemySheet.data)
  if (ability) return resolveEnemySpell({ gameStateDir, enemySheet, target, ability })

  const mods = combinedModifiers(enemySheet.data, target.sheet.data)
  const result = resolveAttack({ attacker: enemySheet.data, defender: target.sheet.data, ...mods })
  applyCharacterUpdate(gameStateDir, target.name, { hp: result.hit ? -result.damage : 0 })

  const outcome = result.fumble
    ? `Combat: ${enemyName} attacks ${target.name} — rolled a natural 1: FUMBLE, automatic miss.`
    : `Combat: ${enemyName} attacks ${target.name} — rolled ${result.total} vs AC ${result.targetAC}: ${result.hit ? `HIT for ${result.damage} damage` : 'MISS'}.`

  return { resolvedOutcome: outcome, targetName: target.name }
}
