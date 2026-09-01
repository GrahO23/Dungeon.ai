# Scenario bundle file schema

A scenario bundle lives at `scenarios/<slug>/` in the Dungeon.ai repo root (git-tracked — distinct
from `game-state/`, which is the gitignored, single-live-session runtime directory the server
actually plays out of). `slug` must be kebab-case and match the directory name.

```
scenarios/<slug>/
├── scenario.json
├── world.md
├── map.md
├── story.md
└── enemies/
    ├── <enemy-slug>.md
    └── ...
```

At load time (`POST /api/setup/start-scenario`), the server copies `world.md`, `map.md`, and
`story.md` into `game-state/` (regenerating fresh timestamps), copies every file under `enemies/`
into `game-state/enemies/`, pulls the `## Opening Narration` section out of `story.md` to log as
the game's first turn, and starts the party at `map.md`'s `currentLocationId`. Every file below
must parse with `gray-matter` (YAML frontmatter between `---` lines, then a markdown body) exactly
like the corresponding live state file — these are the same on-disk schemas `server/src/state/*.js`
reads and writes, not a separate format.

## scenario.json

Plain JSON (no frontmatter), the manifest listed by `GET /api/scenarios` for the lobby picker:

```json
{
  "slug": "goblin-warren",
  "title": "The Goblin Warren",
  "description": "A short, punchy one-sentence pitch shown in the scenario picker.",
  "recommendedPartySize": "2-4",
  "difficulty": "easy"
}
```
`difficulty` should be one of `easy`, `medium`, `hard` (matches the skill-check difficulty words
used elsewhere in the engine, though this field is descriptive only — it isn't read by the rules
engine). `slug` must exactly match the directory name.

## world.md

```yaml
---
title: The Goblin Warren
---
## Setting
One paragraph describing the overall world and its tone.

## Factions
- Faction Name: one sentence description
- ...
```
1-3 factions. This file is lore/reference only — it is never included in the per-turn DM prompt
(see `server/src/ollama/dm.js` — deliberate, to keep the per-turn context budget small), so put
color and history here freely.

## map.md

```yaml
---
currentLocationId: warren-gate
locations:
  - id: warren-gate
    name: Warren Gate
    description: >
      A crude wooden palisade of sharpened stakes guards the entrance to the goblin warren, lashed
      together with rope and studded with crow skulls meant to ward off intruders. Smoke curls up
      from cookfires beyond it, carrying the smell of charred meat, and the low murmur of goblin
      voices drifts out through the gap where the gate hangs half-open. A dented iron bell hangs
      from a post beside the gate, clearly meant to raise an alarm if struck.
    connectsTo: [tunnel-junction]
    questHook: ""
  - id: tunnel-junction
    name: Tunnel Junction
    description: >
      Torchlit tunnels branch three ways into the dark, the walls slick with damp and scored with
      crude goblin glyphs. Bones — some clearly not goblin — are piled in a side alcove, and a
      cold draft from the leftmost tunnel suggests it leads somewhere larger.
    connectsTo: [warren-gate, chieftains-hall]
    questHook: "Rumors say the chieftain keeps the stolen relic here."
  - id: chieftains-hall
    name: Chieftain's Hall
    description: >
      A wide cavern lit by roaring bonfires, where the goblin chieftain holds court from a throne
      built of scavenged furniture and stolen armor plating. Trophies — weapons, banners, a knight's
      helm — hang from the walls, and the floor is littered with gnawed bones and spilled ale.
    connectsTo: [tunnel-junction]
    questHook: "The main quest concludes here."
---
```
(No markdown body needed — the server regenerates it from the location list.)

4-8 locations, forming one connected graph reachable from `currentLocationId` via `connectsTo`
links listed **in both directions** (if A connects to B, B must also list A). Every `questHook`
should tie back to a beat in `story.md`'s `## DM Plan` or `## Win Conditions`, or be an empty
string. The climax location (where the main quest resolves, typically where the boss lives) must
be reachable.

Write each `description` as 2-4 sentences of vivid, concrete detail — sights, sounds, smells, a
notable object or feature the party could interact with, and a hint of danger or opportunity —
not a single flat sentence. This is the same bounded "nearby locations" context fed into every
per-turn DM prompt (`getNearbyLocations` — current location plus its direct connections only), so
richer descriptions directly improve how vividly the DM can narrate a room without adding to the
full-map context budget.

## story.md

```yaml
---
status: playing
currentAct: 1
---
## Premise
One or two sentence campaign premise.

## Main Quest
One sentence describing the main quest.

## Active Quests

## DM Plan
- Ordered list of 3-5 major story beats, early to late. Never shown to players directly —
  it quietly steers every future turn's narration since the DM prompt includes all of story.md.

## Story So Far
- The opening beat, matching the scene the party starts in.

## Win Conditions
- A concrete, checkable condition for how the scenario can end in victory (e.g. "Defeat the
  Goblin Chieftain" or "Recover the Sunstone and escape the warren").
- Optionally more than one path to victory (combat and non-combat).

## Opening Narration
The DM's spoken opening, addressed directly to the players — start with something like "Welcome,
adventurers...", establish the situation, and end on a hook for their first action. This section
is stripped out of the copy written to game-state/story.md at load time (it's logged as the
game's turn 0 instead) — write it as if a player is hearing it read aloud for the first time, not
as backstory documentation.
```
`## Active Quests` is conventionally left empty at scenario-authoring time (the same as the
freeform game-start path) — it fills in during play. `## Win Conditions` is new: it isn't read by
any code yet, but is required in every scenario as the concrete definition of victory so the DM
Plan and locations can be built to actually satisfy it, and so a future win-condition-checking
feature has something real to read.

## enemies/<enemy-slug>.md

One file per enemy, NPC, or boss — `<enemy-slug>` should be `kebab-case` of the enemy's `name`
(matches `server/src/state/characters.js#slugify`'s convention, reused by `state/enemies.js`).

```yaml
---
name: Goblin Chieftain
kind: boss
hp: 30
maxHp: 30
ac: 14
attackBonus: 5
damageDice: 2d6
locationId: chieftains-hall
hostile: true
personality: Boastful and cruel, but a coward underneath once his warband is gone.
backstory: >
  Grulka clawed his way to chieftain by killing the last one in his sleep, and rules through fear
  rather than respect. He is obsessed with the Sunstone he stole from a passing caravan, convinced
  it will let him command the other warren clans — he'll gloat about this if given the chance to
  talk before a fight breaks out.
loot:
  - Chieftain's Warclub
  - The Sunstone
---
```
`kind` is one of `enemy`, `npc`, `boss` (advisory/flavor — not read by the rules engine, but
`boss` should always be true for the scenario's climactic fight). `locationId` must match a real
id from `map.md`. `hostile: false` is valid for a friendly/neutral NPC that shouldn't be pulled
into combat when players enter its location — use it for quest-givers, merchants, and named
characters the players are meant to talk to rather than fight. `attackBonus`/`damageDice` feed
directly into `server/src/rules/combat.js#resolveAttack` — pick numbers that keep a fight
winnable for a party of the `scenario.json` `recommendedPartySize` (a rough guide: `ac` 10-14,
`attackBonus` 2-6, `damageDice` `1d6` to `2d6` for regular enemies, up to `3d6`/higher `hp` for a
boss).

`personality` (a short trait phrase) and `backstory` (1-2 sentences on who they are, where they
came from, and what they currently want) are what let the DM actually roleplay this NPC when a
player talks to them instead of — or before — fighting them (`server/src/ollama/prompts.js`
feeds every NPC/enemy at the party's current location into the per-turn prompt as "Notable NPCs
Here", full backstory included). Give every named NPC both fields, hostile or not — a hostile one
still benefits from a personality when a player tries to talk their way past them, or when the DM
narrates their taunts. Only unnamed, disposable trash mobs (a generic "Goblin Guard" with no
individual identity) can skip them. A friendly NPC meant purely for conversation (a quest-giver,
a merchant) can omit `hp`/`maxHp`/`ac`/`attackBonus`/`damageDice`/`loot` entirely — omitting `hp`
does not hide them from the DM (`listEnemiesAtLocation` never gates a `hostile: false` entry on
hp), only combat gates on it.

A scenario needs at least 3-5 enemies/NPCs total, and at least one `kind: boss` tied to the
climax location named in `story.md`'s Win Conditions.

### Optional: spellcasting, resistances, and saves

Every field below is optional and fails soft when omitted — an enemy with none of them behaves
exactly as before (a plain weapon attack every turn, no special damage handling). Reach for them
to make a specific fight more memorable (a spellcasting boss, an ooze that shrugs off blades but
melts to fire), not on every enemy.

```yaml
---
name: Ashfen Shaman
kind: enemy
hp: 18
maxHp: 18
ac: 12
attackBonus: 3
damageDice: 1d6
saveBonus: 2
spellUsesRemaining: 3
resistances:
  - poison
vulnerabilities:
  - radiant
abilities:
  - name: Poison Spit
    resolution: attack
    damageType: poison
    damageDice: 1d8
  - name: Choking Fumes
    resolution: save
    saveAbility: con
    damageType: poison
    damageDice: 2d6
locationId: ashfen-camp
hostile: true
---
```

- `abilities`: same shape as a player's spellbook (`server/src/rules/constants.js#CLASS_STARTING_ABILITIES`)
  — each entry needs `resolution` (`attack` or `save`), `damageDice`, and `damageType` (fire,
  force, radiant, poison, necrotic, cold, lightning, thunder, acid, or psychic); `save`-resolution
  entries also need `saveAbility` (str/dex/con/int/wis/cha). Only offensive entries belong here —
  an enemy never needs non-damage abilities, since it has no player to narrate a buff/heal for.
  Giving an enemy `abilities` lets its turn pick between casting one and a plain weapon attack
  (`server/src/engine/actionResolver.js#resolveEnemyTurn`); leave it out for a purely martial enemy.
- `spellUsesRemaining`: how many times the enemy can cast before it's stuck with weapon attacks for
  the rest of the fight. Optional even when `abilities` is set — defaults to 2. Pick higher for a
  boss meant to keep casting, lower for a one-trick minion.
- `saveBonus`: the flat bonus added to the enemy's own saving throws when a *player's* save-based
  spell targets it (mirrors `attackBonus`'s role for attack rolls). Only matters if players in this
  scenario have save-based spells to throw — omit it to default to +0.
- `resistances` / `vulnerabilities`: arrays of damage types (same list as above), applied whenever
  this enemy is the one taking damage. A resistant enemy takes half damage (rounded down, minimum
  1) from that type; a vulnerable one takes double. Applies to both a player's weapon damage
  (always `physical`) and a player's spell damage of a matching type — it has no effect on damage
  this enemy deals to players, only damage it receives.
