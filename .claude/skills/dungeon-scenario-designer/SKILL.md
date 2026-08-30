---
name: dungeon-scenario-designer
description: This skill should be used when the user wants to "design a scenario for Dungeon.ai", "create a new Dungeon.ai campaign/adventure", "add a pre-built game/quest to Dungeon.ai", "write a new dungeon/adventure for the game", or otherwise asks to author a complete, playable Dungeon.ai world/story/NPCs/enemies/quest as a scenario the game can load.
---

Design a complete, self-contained Dungeon.ai scenario — a world, a connected map, a cast of
NPCs/enemies/bosses, a main quest, and explicit win conditions — and write it as a scenario
bundle at `scenarios/<slug>/` in the Dungeon.ai repo so the game can load it directly from the
lobby's scenario picker instead of having the DM invent a story live.

Read `references/schema.md` (in this skill's own directory) before writing anything — it is the
canonical, byte-exact frontmatter schema for every file in the bundle, copied from the real state
modules the running game reads (`server/src/state/world.js`, `map.js`, `story.js`,
`characters.js`, `enemies.js`). A scenario is only useful if it loads without transformation, so
match it exactly rather than improvising a shape that looks similar.

## Process

0. **Ask what's missing before designing anything.** If the user's request already pins down a
   detail below, don't re-ask it — only fill gaps. Use `AskUserQuestion` (single call, multiple
   questions) to cover whatever of these the request left open:
   - **Style/theme** — a genre, tone, or specific inspiration (e.g. "gothic horror fishing
     village," "high fantasy heist," "Fighting-Fantasy-style deathtrap dungeon"). If the user gave
     no direction at all, offer a few concrete, varied pitches to choose from (plus "surprise me")
     rather than a blank "what genre?" question.
   - **Map size** — small (4-5 locations), medium (6-7), or large (8, the schema's current max —
     see `references/schema.md`). This drives how many rooms/areas to sketch in step 2.
   - **Number of players** — the recommended party size (e.g. 2, 3-4, 5-6), which drives
     `scenario.json.recommendedPartySize` and the enemy/boss tuning in step 3.
   - **Difficulty** — easy, medium, or hard, feeding `scenario.json.difficulty` and enemy stats.

   Skip this step entirely only if the user's request already specifies all four (e.g. "a small,
   easy 2-player pirate-themed scenario") — then proceed straight to step 1.

1. **Establish the premise.** Derive a setting, tone, a one-line premise, a main quest, and at
   least one concrete win condition — a specific, checkable way the scenario ends in victory
   (defeat a named boss, recover a named item and escape, negotiate a truce — pick something a
   Dungeon Master could look at the game state and say yes/no to) — from the style/theme settled
   in step 0. Note a second, non-combat path to victory when it fits the premise (Dungeon.ai's
   combat/skill-check rules are deterministic server-side, but nothing requires every scenario to
   be solved by fighting).

2. **Design the map.** Sketch a connected graph sized per step 0's answer (4-5 locations for
   small, 6-7 for medium, 8 for large — 8 is the schema's current ceiling; if the user explicitly
   wants more, say so and either split into a bigger single graph carefully or flag the tradeoff
   before exceeding it), starting from an obvious entry point and ending at a climax location
   where the main quest resolves. Every `connectsTo` link must go both ways. Give each location a
   `questHook` when it ties to a story beat, an empty string otherwise. Write each `description`
   as 2-4 sentences of vivid, concrete sensory detail (sights, sounds, smells, a notable object or
   feature) per `references/schema.md` — not a single flat sentence.

3. **Populate the cast.** Write 3-5 enemies/NPCs, placed at specific `locationId`s from the map.
   Include at least one `kind: boss` at the climax location, tuned (per `references/schema.md`'s
   guidance and step 0's difficulty/party-size answers) to be a real fight but winnable for the
   chosen party size. Include at least one `hostile: false` NPC if the premise has room for a
   quest-giver, informant, or merchant — not every location needs to be a fight. Give every named
   enemy/NPC (hostile or not) a concrete `personality` and `backstory` per `references/schema.md`
   — specific enough that a player could actually hold a conversation with them and walk away
   knowing something real (a name to drop, a grudge, a rumor, a price for their help) — only
   generic unnamed trash mobs can skip these fields.

4. **Write the DM Plan and Story So Far.** 3-5 ordered beats in `story.md`'s `## DM Plan` (never
   shown to players — it steers the DM's narration turn to turn) that lead from the opening scene
   to the win condition(s). `## Story So Far` starts with just the opening beat.

5. **Write the Opening Narration.** A short, immersive, second-person-plural address to the
   players (start with something like "Welcome, adventurers…"), establishing where they are and
   ending on a concrete hook for their first action — this is what's actually read aloud as the
   game's first turn, not documentation, so write it the way the DM's own per-turn narration
   reads (plain prose, no markdown formatting, roughly 3-5 sentences).

6. **Write every file** at `scenarios/<slug>/` exactly per `references/schema.md`: `scenario.json`,
   `world.md`, `map.md`, `story.md`, and one file per enemy/NPC under `enemies/`. Use `slug` as a
   short kebab-case id for both the directory name and the `scenario.json.slug` field — they must
   match.

7. **Validate before finishing.** Check, by reading the files back:
   - Every `connectsTo` id in `map.md` resolves to a real location, and links are bidirectional.
   - Every `locationId` on an enemy/NPC file resolves to a real location in `map.md`.
   - Every non-empty `questHook` corresponds to something in `story.md`'s DM Plan or Win
     Conditions — no orphaned hooks.
   - At least one `kind: boss` enemy exists, placed at the win condition's location.
   - `map.md`'s `currentLocationId` is a real location id, and it's the intended starting point
     (usually the entry to the graph, not the climax).
   - `scenario.json`'s `slug` matches the directory name.

Report the finished scenario's path and a one-paragraph summary of the premise/win condition back
to the user — don't start the game or touch `game-state/` (the live single-session directory);
loading a scenario into play happens separately via the lobby's scenario picker (`POST
/api/setup/start-scenario`), not as part of authoring it.
