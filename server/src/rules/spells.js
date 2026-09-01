import { rollD20, rollDiceString, abilityModifier } from './dice.js'
import { computeAC } from './combat.js'
import { CASTING_ABILITY_BY_CLASS, DEFAULT_PROFICIENCY_BONUS } from './constants.js'

// A caster's combined spell attack bonus (also used to derive save DC).
// Player characters derive it from their casting-ability modifier + spell
// proficiency, same as combat.js#resolveAttack derives a weapon attack
// bonus from str/dex; enemies have no ability-score block today, just a
// flat attackBonus (state/enemies.js), which stands in directly — same
// flat-vs-derived split resolveAttack already uses for weapon attacks.
function casterSpellBonus(caster) {
  if (typeof caster.attackBonus === 'number') return caster.attackBonus
  const ability = CASTING_ABILITY_BY_CLASS[caster.class] ?? 'int'
  return abilityModifier(caster.stats?.[ability] ?? 10) + (caster.proficiencyBonus ?? DEFAULT_PROFICIENCY_BONUS)
}

// Halves damage (min 1) for a resistant defender, doubles it for a
// vulnerable one, by damage type. Only enemies carry resistances/
// vulnerabilities today (state/enemies.js) — a defender with neither is
// unaffected, same fail-soft convention as the rest of the rules engine.
export function applyDamageType(damage, damageType, defender) {
  if (!damage || !damageType) return damage
  if (defender.resistances?.includes(damageType)) return Math.max(1, Math.floor(damage / 2))
  if (defender.vulnerabilities?.includes(damageType)) return damage * 2
  return damage
}

// caster: a character ({ class, stats, proficiencyBonus? }).
// defender: a character or enemy, either with an explicit `ac` or `stats` to derive it from.
// ability: an offensive CLASS_STARTING_ABILITIES entry with resolution: 'attack'.
// advantage/disadvantage/bonus: status-effect modifiers on the caster's own
// roll, computed by the caller from the caster's statusEffects — see
// engine/actionResolver.js.
export function resolveSpellAttack({ caster, defender, ability, advantage = false, disadvantage = false, bonus = 0 }) {
  const attackBonus = casterSpellBonus(caster) + bonus

  const roll = rollD20({ advantage, disadvantage })
  const targetAC = defender.ac ?? computeAC(defender)
  const critical = roll === 20
  const fumble = roll === 1
  const total = roll + attackBonus
  const hit = !fumble && (critical || total >= targetAC)

  let damage = 0
  if (hit) {
    damage = rollDiceString(ability.damageDice)
    if (critical) damage += rollDiceString(ability.damageDice)
    damage = applyDamageType(Math.max(1, damage), ability.damageType, defender)
  }

  return { roll, attackBonus, total, targetAC, hit, critical, fumble, damage, spell: ability.name, damageType: ability.damageType }
}

// A defender's saving throw modifier: characters derive it from the ability
// score the spell targets; enemies have no ability-score block today (just
// a flat attackBonus — state/enemies.js), so they carry an equivalent flat
// `saveBonus` instead, defaulting to 0 when omitted.
function saveModifier(defender, saveAbility) {
  if (typeof defender.saveBonus === 'number') return defender.saveBonus
  return abilityModifier(defender.stats?.[saveAbility] ?? 10)
}

// ability: an offensive CLASS_STARTING_ABILITIES entry with resolution: 'save'.
// Full damage on a failed save, half (min 1) on a success — the common 5e
// save-for-half pattern, applied uniformly rather than per-spell.
// advantage/disadvantage/bonus: status-effect modifiers on the *defender's*
// saving throw (they're the one rolling it), computed by the caller from
// the defender's statusEffects — see engine/actionResolver.js.
export function resolveSpellSave({ caster, defender, ability, advantage = false, disadvantage = false, bonus = 0 }) {
  const dc = 8 + casterSpellBonus(caster)

  const roll = rollD20({ advantage, disadvantage })
  const modifier = saveModifier(defender, ability.saveAbility) + bonus
  const total = roll + modifier
  const success = total >= dc

  let damage = rollDiceString(ability.damageDice)
  if (success) damage = Math.max(1, Math.floor(damage / 2))
  damage = applyDamageType(damage, ability.damageType, defender)

  return { roll, modifier, total, dc, success, damage, spell: ability.name, damageType: ability.damageType }
}
