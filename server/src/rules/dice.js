export function rollDie(sides) {
  return 1 + Math.floor(Math.random() * sides)
}

export function rollDice(count, sides) {
  let total = 0
  for (let i = 0; i < count; i += 1) total += rollDie(sides)
  return total
}

// Parses a "NdM" or "NdM+K" damage string, e.g. "1d6", "2d4+1"
export function rollDiceString(diceString) {
  const match = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(diceString.trim())
  if (!match) throw new Error(`Invalid dice string: ${diceString}`)
  const [, count, sides, bonus] = match
  return rollDice(Number(count), Number(sides)) + Number(bonus ?? 0)
}

export function rollD20({ advantage = false, disadvantage = false } = {}) {
  if (advantage && !disadvantage) return Math.max(rollDie(20), rollDie(20))
  if (disadvantage && !advantage) return Math.min(rollDie(20), rollDie(20))
  return rollDie(20)
}

export function abilityModifier(score) {
  return Math.floor((score - 10) / 2)
}
