export const CLASSES = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
]

// Classes with real spellcasting — purely a display distinction (their known
// abilities are shown as a "Spellbook" rather than "Special Moves"); the
// server stores both identically (server/src/rules/constants.js#CASTER_CLASSES
// is the source of truth for which classes get which starting list).
export const CASTER_CLASSES = new Set(['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'])

const FIRST_NAMES = [
  'Alara', 'Borin', 'Cassian', 'Dorwyn', 'Elowen', 'Fenwick', 'Gwyneth', 'Hadrian',
  'Isolde', 'Joren', 'Kestrel', 'Liora', 'Magnus', 'Nyssa', 'Oswin', 'Perrin',
  'Quillon', 'Rowena', 'Soren', 'Talia', 'Ulric', 'Vesna', 'Wren', 'Xanthe',
  'Yorick', 'Zara',
]

const SURNAMES = [
  'Ashdown', 'Blackwood', 'Cinderfall', 'Duskwalker', 'Emberholt', 'Frostvane',
  'Grimshaw', 'Hollowmere', 'Ironbrook', 'Ravenscar', 'Silverleaf', 'Stormrider',
  'Thornwood', 'Wintermere', 'Wyldheart',
]

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export function generateRandomName() {
  return `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`
}
