import { rollD20, abilityModifier } from './dice.js'
import { DC_BY_DIFFICULTY, SKILL_ABILITY_MAP } from './constants.js'

export function resolveSkillCheck({ modifier = 0, dc = DC_BY_DIFFICULTY.medium, advantage = false, disadvantage = false } = {}) {
  const roll = rollD20({ advantage, disadvantage })
  const total = roll + modifier
  return {
    roll,
    modifier,
    total,
    dc,
    success: total >= dc,
    critical: roll === 20 ? 'success' : roll === 1 ? 'failure' : null,
  }
}

// character: { stats: {str,dex,con,int,wis,cha}, skills?: {name: bonus} }
export function skillModifier(character, skillName) {
  const ability = SKILL_ABILITY_MAP[skillName] ?? 'wis'
  const abilityScore = character.stats?.[ability] ?? 10
  const proficiency = character.skills?.[skillName] ?? 0
  return abilityModifier(abilityScore) + proficiency
}

export function difficultyToDC(difficulty) {
  return DC_BY_DIFFICULTY[difficulty] ?? DC_BY_DIFFICULTY.medium
}
