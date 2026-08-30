export const DC_BY_DIFFICULTY = { easy: 10, medium: 15, hard: 20 }

export const SKILL_ABILITY_MAP = {
  persuasion: 'cha',
  deception: 'cha',
  intimidation: 'cha',
  performance: 'cha',
  stealth: 'dex',
  acrobatics: 'dex',
  sleightOfHand: 'dex',
  perception: 'wis',
  insight: 'wis',
  survival: 'wis',
  medicine: 'wis',
  animalHandling: 'wis',
  investigation: 'int',
  arcana: 'int',
  history: 'int',
  nature: 'int',
  religion: 'int',
  athletics: 'str',
}

// Starting weapon per class, used when a character has no equippedWeapon set.
export const CLASS_STARTING_WEAPON = {
  Barbarian: { name: 'Greataxe', damageDice: '1d12' },
  Bard: { name: 'Rapier', damageDice: '1d8', finesse: true },
  Cleric: { name: 'Mace', damageDice: '1d6' },
  Druid: { name: 'Quarterstaff', damageDice: '1d6' },
  Fighter: { name: 'Longsword', damageDice: '1d8' },
  Monk: { name: 'Unarmed Strike', damageDice: '1d4', finesse: true },
  Paladin: { name: 'Longsword', damageDice: '1d8' },
  Ranger: { name: 'Shortbow', damageDice: '1d6', finesse: true },
  Rogue: { name: 'Shortsword', damageDice: '1d6', finesse: true },
  Sorcerer: { name: 'Dagger', damageDice: '1d4', finesse: true },
  Warlock: { name: 'Dagger', damageDice: '1d4', finesse: true },
  Wizard: { name: 'Quarterstaff', damageDice: '1d6' },
}

export const UNARMED_DAMAGE_DICE = '1d4'
export const DEFAULT_ARMOR_BONUS = 0
export const DEFAULT_PROFICIENCY_BONUS = 2

// One flavor skill bonus granted at character creation, per class.
export const CLASS_SKILL_BONUS = {
  Barbarian: { athletics: 2 },
  Bard: { persuasion: 2 },
  Cleric: { medicine: 2 },
  Druid: { nature: 2 },
  Fighter: { athletics: 2 },
  Monk: { acrobatics: 2 },
  Paladin: { intimidation: 2 },
  Ranger: { survival: 2 },
  Rogue: { stealth: 2 },
  Sorcerer: { arcana: 2 },
  Warlock: { deception: 2 },
  Wizard: { investigation: 2 },
}
