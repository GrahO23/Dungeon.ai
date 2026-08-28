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
