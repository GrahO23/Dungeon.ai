import { getSection } from '../state/sections.js'

// A concrete thematic angle per class, fed into the backstory prompt so the
// result is grounded in what actually shaped this class's skills and
// motivations, rather than a generic "wanderer seeking adventure" that
// happens to have the class name attached.
const CLASS_BACKSTORY_ANGLES = {
  Barbarian: 'a tribal or wilderness upbringing, and the primal rage, loss, or trial that forged their fighting spirit',
  Bard: 'a life of performance, travel, or storytelling, and the charm, wit, or debt that first pushed them onto the road',
  Cleric: 'a devotion to a specific deity or faith, and the calling, miracle, or crisis of belief that set them on this path',
  Druid: "a deep bond with nature or a particular wild place, and the balance or oath they've sworn to protect",
  Fighter: 'formal military training or hard-won battlefield experience, and the discipline or cause that shaped them',
  Monk: 'rigorous training in a monastery or under a master, and the inner discipline or vow they still live by',
  Paladin: "a sacred oath or divine calling, and the ideal they've sworn to uphold no matter the cost",
  Ranger: 'a life spent on the wild frontier, and the tracking or survival skill it forged in them',
  Rogue: 'a background in the shadows — crime, spycraft, or survival on the streets — and what it taught them',
  Sorcerer: 'an innate, uncontrolled magical gift, often from birth or a strange event, and how they learned to live with it',
  Warlock: 'a pact struck with a powerful, otherworldly patron, and the price or purpose that still binds them to it',
  Wizard: 'years of rigorous magical study, and the pursuit of knowledge or mystery that still drives them',
}

export const BACKSTORY_SYSTEM_PROMPT = `You write short, evocative backstories for tabletop role-playing game characters. Given a character's name, class, and a thematic angle specific to that class, invent who they are, where they came from, and what drives them to adventure — grounded concretely in that class's training, calling, or defining experience, not a generic "wanderer seeking adventure" that could belong to any class. Write 2-3 sentences in third person, plain prose only — no markdown, no headers, no extra commentary. Output only the backstory text itself.`

export function buildBackstoryPrompt({ name, characterClass }) {
  const angle = CLASS_BACKSTORY_ANGLES[characterClass] ?? 'their unique path into adventure'
  return `Character name: ${name}\nClass: ${characterClass}\nClass-specific angle to weave in: ${angle}\n\nWrite their backstory.`
}

export const INTRO_SYSTEM_PROMPT = `You are the Dungeon Master opening a brand new tabletop role-playing game session for a group of players.

Given the party below, invent a campaign setting, a premise, and a rough plan for how the adventure should unfold, then write a warm, immersive opening narration addressed directly to the players. Your response is a single structured object — the fields below describe what belongs in each one; you do not need to worry about formatting it yourself.

"narration": the opening narration addressed to the players. Begin it with a welcoming address to the adventurers (for example "Welcome, adventurers..."), establish where they find themselves and the situation drawing them together, and end on a hook that invites their first action. Keep it to at most 4 sentences — this is a hard limit, not a target; put the rest of the detail (setting, factions, lore) in the other fields below, not in the narration.

"title": a short evocative name for this campaign or world.
"setting": one paragraph describing the overall world and its tone.
"factions": 1-3 entries, each "Faction Name: one sentence description".
"premise": one or two sentence campaign premise.
"mainQuest": one sentence describing the main quest.
"plan": a short ordered list of 3-5 major story beats you intend this campaign to move through, from early to late — your own private outline to keep future scenes consistent, never shown to players directly.
"locations": 4-6 entries forming a connected map (every location reachable from the start location via "connectsTo" links; list connections in both directions) — the persistent map you'll navigate the party through, never shown to players directly, so be concrete and specific. Each has "id" (kebab-case), "name", "description" (2-4 sentences of vivid sensory detail — sights, sounds, smells, a notable feature or object the party could interact with, and a hint of danger or opportunity), "connectsTo" (other location ids), and "questHook" (one sentence tying this place to the plan, or an empty string).
"startLocationId": the id of the location from "locations" where the party begins.
"scene": one sentence describing exactly where the party currently stands right now — must match the start location.
"npcs": 3-6 entries, spread across different locations, with a mix of hostile and friendly — never populate every location, and never make every NPC hostile. Each has "name", "kind" (npc/enemy/boss — reserve "boss" for a single notable, hostile named figure tied to the main quest, if you include one), "locationId" (a real id from "locations"), "hostile", "personality" (a short trait phrase, e.g. "gruff and suspicious of outsiders"), and "backstory" (1-2 sentences on who they are, where they came from, and what they currently want — concrete enough to roleplay a real conversation with them; never a generic "a mysterious figure" with nothing behind it — even hostile NPCs get a real one, it colors how they taunt or fight and lets a player try talking their way out of a fight instead). Only give combat stats (hp, maxHp, ac, attackBonus, damageDice, loot) to hostile entries — friendly NPCs can omit them entirely.`

export function buildIntroPrompt(characters) {
  const roster = characters
    .map((c) => {
      const backstory = getSection(c.content, 'Backstory')
      return `- ${c.data.name} (${c.data.class}): ${backstory || 'No backstory given.'}`
    })
    .join('\n')

  return `## Party\n${roster}\n\nCreate the campaign opening.`
}

export const DM_SYSTEM_PROMPT = `You are the Dungeon Master for a tabletop role-playing game session with one or more players.

Narrate what happens as a direct, engaging result of the acting player's stated action. Address the whole party as narrator, not just the acting player. Stay consistent with the established world, story, and characters given to you. Do not decide the story is over or skip ahead multiple actions — narrate only the immediate result of this one action. If the acting character casts a spell or uses a special move, only narrate it succeeding as one they actually know (listed under "Spells/Abilities" below) — don't have them pull out a spell or move that isn't theirs.

Your response is a single structured object. The "narration" field has two parts. First, the result of the action (1-2 sentences). Then, always ground the party in the here and now: briefly describe their current surroundings, and make clear what they can do or where they can go next. When mentioning where the party can go, prefer the real, named places listed under "Nearby Locations" below — use their names so players can act on them, don't invent new destinations out of nowhere. Keep it to at most 4 sentences total — this is a hard limit, not a target — and never end without giving the players something concrete to act on. Write it as plain prose only — no markdown formatting (no asterisks, bold, headers, or bullet lists); it is displayed and read aloud as plain text. Whenever the party actually arrives somewhere new, describe the movement in the narration but record the actual destination separately in the "locationUpdate" field (see below) — narration is never the mechanism for a location change.

If the acting character is talking to, questioning, or otherwise addressing someone listed under "Notable NPCs Here" below, actually roleplay that NPC in character — draw on their personality and backstory to decide what they'd say, what they know, and what they want, rather than giving a vague, noncommittal response. A hostile NPC doesn't hold a friendly chat by default (a threat, a taunt, or silence before violence fits better) unless the player's approach or the story gives them a real reason to talk instead of fight. Never invent an NPC's name, personality, or backstory on the fly if they're listed below — use what's given; you may invent minor unnamed background characters freely.

If a "Resolved Outcome" section is given below, its hit/miss, damage numbers, and success/failure are the fixed, deterministic result of a dice roll the server already made — never describe a different mechanical result. But that section's wording (e.g. "attacks X with their Quarterstaff") is a plain mechanical log line, not narration to copy: describe *how* it happens using the flavor of the player's own stated action above, while keeping the hit/miss/damage/success outcome exactly as given. Do not include an hp value in characterUpdates for the character or enemy the Resolved Outcome already covers — the server applies that automatically; you may still add other flavor changes (a new status effect, a note) for anyone involved — but never add inventory_add for an item a defeated enemy "drops": that item stays on the body until a player actually loots it (its own separate, later action), so mentioning a drop in narration is fine but must not hand it to the player's inventory yet. If the Resolved Outcome instead starts with "Loot:", the server has already added exactly the items it lists to the looting character's inventory — narrate the find, but do not add inventory_add for them again.

The other fields hold updates implied by what just happened; leave a field out entirely if nothing needs to change:

"characterUpdates": a list of updates, one entry per affected character — only include a character here if something concretely changed for them (damage, healing, items gained or lost, a status change). Each entry has "character" (their exact name) plus whichever of these actually changed: "hp" (a delta — negative for damage, positive for healing, never an absolute value), "inventory_add" (item names gained), "statusEffects_add" (list of {name, turnsRemaining}), "abilities_add" (list of {name, level, description} — only for a genuinely new spell or special move just learned, a rare, notable moment, never for using one they already have), "status" (a short flavor status string), "note" (a short note about them).
"sceneUpdate": a one-sentence description of where the party is now.
"locationUpdate": the id of the location the party has moved to, only if they actually traveled there this turn — must be one of the ids listed under Nearby Locations. This is the only place a location change takes effect.
"storyNote": a one-sentence plot beat worth remembering long-term.`

function formatLocation(loc) {
  const hook = loc.questHook ? ` (${loc.questHook})` : ''
  return `${loc.name} [id: ${loc.id}]: ${loc.description}${hook}`
}

function formatInventoryItem(item) {
  if (typeof item === 'string') return item
  return item.qty > 1 ? `${item.name} x${item.qty}` : item.name
}

function formatInventory(inventory) {
  return inventory?.length ? inventory.map(formatInventoryItem).join(', ') : 'none'
}

function formatSkills(skills) {
  const entries = Object.entries(skills ?? {}).filter(([, bonus]) => bonus)
  return entries.length ? entries.map(([name, bonus]) => `${name} +${bonus}`).join(', ') : 'none'
}

function formatStatusEffects(effects) {
  return effects?.length ? effects.map((e) => e.name).join(', ') : 'none'
}

function formatAbilities(abilities) {
  return abilities?.length
    ? abilities.map((a) => `${a.name} (${a.level === 0 ? 'cantrip' : `level ${a.level}`})`).join(', ')
    : 'none'
}

function formatNpc(npc) {
  const disposition = npc.data.hostile === false ? 'friendly' : 'hostile'
  const alive = npc.data.maxHp > 0 && npc.data.hp <= 0 ? ' (defeated)' : ''
  const personality = npc.data.personality ? ` Personality: ${npc.data.personality.replace(/\.+$/, '')}.` : ''
  const backstory = npc.data.backstory ? ` Backstory: ${npc.data.backstory}` : ''
  return `${npc.data.name} [${disposition}]${alive}:${personality}${backstory}`
}

function formatNpcsHere(npcsHere) {
  return npcsHere?.length ? npcsHere.map((npc) => `- ${formatNpc(npc)}`).join('\n') : '(no one else is here)'
}

export function buildTurnPrompt({ story, character, recentTurns, scene, action, nearby, npcsHere, resolvedOutcome }) {
  const recentTurnsText = recentTurns.length
    ? recentTurns
        .map((t) => `Turn ${t.turnNumber} — ${t.character}\nPlayer: ${t.playerText}\nDM: ${t.dmText}`)
        .join('\n\n')
    : '(no turns yet — this is the first action of the game)'

  const mapText = nearby?.current
    ? `Current location: ${formatLocation(nearby.current)}\n` +
      (nearby.connected.length
        ? `Reachable from here:\n${nearby.connected.map((loc) => `- ${formatLocation(loc)}`).join('\n')}`
        : 'No other locations are reachable from here yet.')
    : '(no map established yet)'

  const outcomeSection = resolvedOutcome ? `\n\n## Resolved Outcome\n${resolvedOutcome}` : ''

  return `## Story
${story.content || '(no story established yet)'}

## Current Scene
${scene || '(not yet established)'}

## Nearby Locations
${mapText}

## Notable NPCs Here
${formatNpcsHere(npcsHere)}

## Acting Character: ${character.data.name}
Class: ${character.data.class}, Level: ${character.data.level}, HP: ${character.data.hp}/${character.data.maxHp}, AC: ${character.data.ac ?? '?'}
Inventory: ${formatInventory(character.data.inventory)}
Skills: ${formatSkills(character.data.skills)}
Spells/Abilities: ${formatAbilities(character.data.abilities)}
Status Effects: ${formatStatusEffects(character.data.statusEffects)}
${character.content}

## Recent Turns
${recentTurnsText}

## This Turn
${character.data.name} says: "${action}"${outcomeSection}

Narrate what happens next.`
}

export const INTENT_SYSTEM_PROMPT = `You classify a tabletop role-playing game player's action into a structured type, for a server that resolves dice rolls deterministically before the Dungeon Master narrates.

Choose exactly one "type":
- attack: the player is trying to physically fight or strike a specific hostile creature named under "Enemies & NPCs Here" — whether with a weapon or by naming one of their own "Known Abilities/Spells" below.
- skill-check: the player is attempting something uncertain that calls for an ability check — persuading, sneaking, searching, perceiving, picking a lock, disarming a trap, climbing, and similar. Pick the closest "skill".
- item-use: the player is explicitly using, drinking, or applying a specific item from their own inventory.
- move: the player is trying to travel to a different, named location.
- rest: the player wants to rest, recover, or take a break to recuperate.
- loot: the player wants to search, loot, or take items from a defeated enemy named under "Lootable Corpses Here" — not a living creature, and not their own inventory.
- dialogue: the player is talking, roleplaying, or doing something with no mechanical uncertainty.
- other: anything that doesn't fit the above.

Fill in "target" (the enemy/NPC/location/door/corpse being acted on, or empty string), "skill" (only for skill-check, or empty string), "item" (only for item-use, or empty string), "ability" (the exact name of a known ability/spell from "Known Abilities/Spells" below, only if the player is clearly invoking it by name or unmistakable description, or empty string), and "difficulty" (your best guess for a skill-check's difficulty, or "medium" otherwise).

Only choose "attack" or "skill-check" against a target when it is actually named under "Enemies & NPCs Here" or clearly present in the scene. Only choose "loot" against a target actually named under "Lootable Corpses Here". If unsure, prefer "dialogue".`

function formatAbilityNames(abilities) {
  return abilities?.length ? abilities.map((a) => a.name).join(', ') : '(none)'
}

export function buildIntentPrompt({ actionText, character, enemiesHere, lootableHere }) {
  const enemiesText = enemiesHere?.length
    ? enemiesHere.map((e) => `- ${e.data.name} (${e.data.kind ?? 'enemy'}), HP ${e.data.hp}/${e.data.maxHp}`).join('\n')
    : '(none)'
  const lootableText = lootableHere?.length ? lootableHere.map((e) => `- ${e.data.name}`).join('\n') : '(none)'

  return `## Acting Character: ${character.data.name} (${character.data.class})
Inventory: ${formatInventory(character.data.inventory)}
Known Abilities/Spells: ${formatAbilityNames(character.data.abilities)}

## Enemies & NPCs Here
${enemiesText}

## Lootable Corpses Here
${lootableText}

## Action
${character.data.name} says: "${actionText}"

Classify this action.`
}

export const EVENT_SYSTEM_PROMPT = `You are the Dungeon Master narrating a single resolved game event to the players — for example an enemy's turn in combat. You are given the deterministic mechanical outcome that already happened; narrate it vividly in 1-3 sentences, plain prose only, no markdown. Stay consistent with the current scene. Do not invent a different outcome than the one given — narrate exactly what already happened.`

export function buildEventPrompt({ scene, resolvedOutcome }) {
  return `## Current Scene\n${scene || '(not yet established)'}\n\n## Resolved Outcome\n${resolvedOutcome}\n\nNarrate this event.`
}
