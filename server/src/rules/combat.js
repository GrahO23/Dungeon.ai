import { rollD20, rollDiceString, abilityModifier } from './dice.js'
import { CLASS_STARTING_WEAPON, UNARMED_DAMAGE_DICE, DEFAULT_ARMOR_BONUS, DEFAULT_PROFICIENCY_BONUS } from './constants.js'

export function computeAC(character) {
  const dexMod = abilityModifier(character.stats?.dex ?? 10)
  const armorBonus = character.armorBonus ?? DEFAULT_ARMOR_BONUS
  return 10 + dexMod + armorBonus
}

function resolveWeapon(character) {
  if (character.equippedWeapon) {
    const item = (character.inventory ?? []).find(
      (i) => typeof i === 'object' && i.name === character.equippedWeapon,
    )
    if (item?.damageDice) return { name: item.name, damageDice: item.damageDice, finesse: item.finesse }
  }
  const classWeapon = CLASS_STARTING_WEAPON[character.class]
  if (classWeapon) return classWeapon
  return { name: 'Unarmed Strike', damageDice: UNARMED_DAMAGE_DICE, finesse: true }
}

// attacker: a character ({ stats, class, equippedWeapon?, inventory? }) or an
// enemy ({ attackBonus, damageDice }, no stats needed).
// defender: a character or enemy, either with an explicit `ac` or `stats` to derive it from.
// advantage/disadvantage/bonus: status-effect modifiers the caller computed
// from both entities' statusEffects — see engine/actionResolver.js.
export function resolveAttack({ attacker, defender, weapon, advantage = false, disadvantage = false, bonus = 0 } = {}) {
  const attackWeapon = weapon ?? (attacker.damageDice
    ? { name: attacker.name, damageDice: attacker.damageDice }
    : resolveWeapon(attacker))

  let abilityMod = 0
  let attackBonus
  if (typeof attacker.attackBonus === 'number') {
    attackBonus = attacker.attackBonus
  } else {
    const strMod = abilityModifier(attacker.stats?.str ?? 10)
    const dexMod = abilityModifier(attacker.stats?.dex ?? 10)
    abilityMod = attackWeapon.finesse ? Math.max(strMod, dexMod) : strMod
    attackBonus = abilityMod + (attacker.proficiencyBonus ?? DEFAULT_PROFICIENCY_BONUS)
  }
  attackBonus += bonus

  const roll = rollD20({ advantage, disadvantage })
  const targetAC = defender.ac ?? computeAC(defender)
  const critical = roll === 20
  const fumble = roll === 1
  const total = roll + attackBonus
  const hit = !fumble && (critical || total >= targetAC)

  let damage = 0
  if (hit) {
    damage = rollDiceString(attackWeapon.damageDice) + abilityMod
    if (critical) damage += rollDiceString(attackWeapon.damageDice)
    damage = Math.max(1, damage)
  }

  return { roll, attackBonus, total, targetAC, hit, critical, fumble, damage, weapon: attackWeapon.name }
}
