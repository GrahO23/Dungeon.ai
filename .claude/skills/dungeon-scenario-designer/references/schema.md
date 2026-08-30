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
    description: A crude wooden palisade guards the entrance to the goblin warren.
    connectsTo: [tunnel-junction]
    questHook: ""
  - id: tunnel-junction
    name: Tunnel Junction
    description: Torchlit tunnels branch three ways into the dark.
    connectsTo: [warren-gate, chieftains-hall]
    questHook: "Rumors say the chieftain keeps the stolen relic here."
  - id: chieftains-hall
    name: Chieftain's Hall
    description: A wide cavern lit by bonfires, where the goblin chieftain holds court.
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

A scenario needs at least 3-5 enemies/NPCs total, and at least one `kind: boss` tied to the
climax location named in `story.md`'s Win Conditions.
