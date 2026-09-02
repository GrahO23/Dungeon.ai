export const DC_BY_DIFFICULTY = { easy: 10, medium: 15, hard: 20 }

// The only status-effect names with real mechanical weight — matched by
// name against a character's/enemy's `statusEffects` list (state/
// characters.js, state/enemies.js). Any other status name, including ones
// the DM invents freely via characterUpdates, stays purely cosmetic (no
// entry here = no mechanical effect), same fail-soft convention as the
// rest of the rules engine. `selfDisadvantage`/`selfBonus` modify the
// afflicted entity's own rolls; `opponentAdvantage` grants advantage to
// whoever attacks it; `skipsTurn` (stunned) bypasses action resolution for
// that entity's turn entirely — see engine/actionResolver.js.
export const STATUS_EFFECT_MODIFIERS = {
  poisoned: { selfDisadvantage: true },
  restrained: { selfDisadvantage: true, opponentAdvantage: true },
  stunned: { opponentAdvantage: true, skipsTurn: true },
  frightened: { selfDisadvantage: true },
  blessed: { selfBonus: 1 },
}

export const ABILITY_NAMES = ['str', 'dex', 'con', 'int', 'wis', 'cha']

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

// Classes that draw on real spellcasting rather than martial/trained special
// moves — purely a display/framing distinction (a "Spellbook" vs. an
// "Abilities" list in the UI); both are stored identically on the character
// (see CLASS_STARTING_ABILITIES below).
export const CASTER_CLASSES = new Set(['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'])

// Starting known spells (casters) or special moves (everyone else), granted
// at character creation. Same shape either way — { name, level, description }
// — stored on the character as `abilities`. For casters, `level` is the
// spell's own level (0 = cantrip); for non-casters it's a rough power tier.
// This purely tracks/displays what a character knows by default — it doesn't
// add a resolution system, so a bare { name, level, description } entry is
// still just flavor and falls through to a normal player action (this covers
// every non-caster special move, plus heals/buffs/marks that don't deal
// direct damage). An offensive spell additionally carries `resolution`
// ('attack' | 'save'), `damageType`, `damageDice`, and (for 'save') a
// `saveAbility` — see rules/spells.js — which is what lets
// actionResolver.js#resolvePlayerIntent resolve it as its own named attack
// instead of silently falling back to the character's equipped weapon.
export const CLASS_STARTING_ABILITIES = {
  Barbarian: [
    { name: 'Reckless Attack', level: 1, description: 'Attack with total abandon, trading your own defense for a much likelier hit.' },
    { name: 'Rage', level: 1, description: 'Fly into a battle fury, shrugging off harm and hitting harder for a short time.' },
  ],
  Bard: [
    { name: 'Vicious Mockery', level: 0, description: 'A cutting insult laced with subtle magic that rattles and weakens a foe.', resolution: 'save', saveAbility: 'wis', damageType: 'psychic', damageDice: '1d4' },
    { name: 'Healing Word', level: 1, description: "A quick, soothing word of magic that mends a nearby ally's wounds." },
  ],
  Cleric: [
    { name: 'Sacred Flame', level: 0, description: 'Call down a flame-like radiance to sear a foe you can see.', resolution: 'save', saveAbility: 'dex', damageType: 'radiant', damageDice: '1d8' },
    { name: 'Cure Wounds', level: 1, description: 'Channel divine energy through a touch to close a wound.' },
  ],
  Druid: [
    { name: 'Produce Flame', level: 0, description: 'Conjure a flickering flame in your palm, usable to strike or light the way.', resolution: 'attack', damageType: 'fire', damageDice: '1d8' },
    { name: 'Entangle', level: 1, description: 'Grasping weeds and vines sprout to restrain foes in the area.' },
  ],
  Fighter: [
    { name: 'Second Wind', level: 1, description: 'Draw on a deep reserve of stamina to recover a burst of hit points.' },
    { name: 'Riposte', level: 2, description: "Punish an enemy's missed attack with an immediate counterstrike." },
  ],
  Monk: [
    { name: 'Flurry of Blows', level: 1, description: 'Follow an attack with a lightning-fast flurry of unarmed strikes.' },
    { name: 'Stunning Strike', level: 2, description: 'Focus your ki into a strike that can stun a foe outright.' },
  ],
  Paladin: [
    { name: 'Lay on Hands', level: 1, description: 'Channel divine energy through touch to heal wounds or cure an ailment.' },
    { name: 'Divine Smite', level: 1, description: 'Infuse a melee hit with radiant power for extra damage against a foe.' },
  ],
  Ranger: [
    { name: "Hunter's Mark", level: 1, description: 'Magically mark a quarry, making it easier to track and strike true.' },
    { name: 'Multishot', level: 2, description: 'Loose a rapid volley of arrows at multiple nearby foes.' },
  ],
  Rogue: [
    { name: 'Sneak Attack', level: 1, description: 'Strike a distracted or unaware foe for devastating extra damage.' },
    { name: 'Cunning Action', level: 2, description: 'Dash, disengage, or hide in the blink of an eye.' },
  ],
  Sorcerer: [
    { name: 'Fire Bolt', level: 0, description: 'Hurl a mote of fire that scorches whatever it strikes.', resolution: 'attack', damageType: 'fire', damageDice: '1d10' },
    { name: 'Magic Missile', level: 1, description: 'Loose unerring darts of magical force at a target.', resolution: 'attack', damageType: 'force', damageDice: '3d4+3' },
  ],
  Warlock: [
    { name: 'Eldritch Blast', level: 0, description: "A crackling beam of eldritch energy, the warlock's signature attack.", resolution: 'attack', damageType: 'force', damageDice: '1d10' },
    { name: 'Hex', level: 1, description: 'Curse a foe, making your attacks against it bite deeper.' },
  ],
  Wizard: [
    { name: 'Fire Bolt', level: 0, description: 'Hurl a mote of fire that scorches whatever it strikes.', resolution: 'attack', damageType: 'fire', damageDice: '1d10' },
    { name: 'Magic Missile', level: 1, description: 'Loose unerring darts of magical force at a target.', resolution: 'attack', damageType: 'force', damageDice: '3d4+3' },
  ],
}

// Which ability score a caster's spells key off (attack bonus and save DC
// both derive from this) — everyone else stays on str/dex like a normal
// weapon attack.
export const CASTING_ABILITY_BY_CLASS = {
  Bard: 'cha',
  Cleric: 'wis',
  Druid: 'wis',
  Paladin: 'cha',
  Ranger: 'wis',
  Sorcerer: 'cha',
  Warlock: 'cha',
  Wizard: 'int',
}

// 5e-lite spell slot table, keyed by character level. Characters never level
// up past 1 today (see state/characters.js), so only that entry is populated
// — kept level-keyed rather than a flat constant so a future leveling system
// can extend this table without touching any call site.
export const SPELL_SLOTS_BY_LEVEL = {
  1: { 1: 2 },
}
