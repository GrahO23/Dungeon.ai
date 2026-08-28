# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dungeon.ai** is a locally-hosted, multiplayer, Dungeons & Dragons style game. Players create characters through a web UI; an Ollama-powered Dungeon Master narrates the game and players interact with it using typed natural language, taking turns in a fixed order. All game state (world, story, characters, turn state, transcript) is persisted as local markdown files rather than a database.

The full design rationale and build plan live in `/home/graham/.claude/plans/structured-dazzling-boot.md` — read it for the "why" behind any of the decisions below.

## Prerequisites

- Node.js 22+
- [Ollama](https://ollama.ai/) running locally (`http://localhost:11434`) with a general-purpose chat model pulled — e.g. `qwen3:14b` (the current default in `server/src/config.js`). Avoid coder-specialized models (e.g. `qwen2.5-coder`) for the DM role; they narrate poorly compared to general instruction-tuned models.

## Commands

Run all commands from the repo root (npm workspaces: `server`, `client`).

- `npm install` — installs dependencies for both workspaces
- `npm run dev` — runs the Express/WS server (`node --watch`) and the Vite dev server concurrently. Client on `http://localhost:5173` (proxies `/api` and `/ws` to the server on `3001`).
- `npm run build` — builds the client to `client/dist`
- `npm run start` — runs the server only, serving the built client from `client/dist` plus the API/WS on one port (production-style local run)

There is no automated test suite yet. Verification during development has been done with ad hoc Node scripts that exercise the state modules and WebSocket protocol directly (see the plan file's per-milestone verification steps).

## Architecture

```
Browser (React) <--REST--> Express API (character creation, start game)
Browser (React) <--WS----> Game Engine (turn queue, in-memory state) <--fs--> game-state/*.md
                                    |
                                    v
                          Ollama client --HTTP--> localhost:11434
```

- **Single global session** — one game/world/party at a time, no multi-room support. There is no auth: a browser "claims" a character name (stored in `localStorage`), which the server checks against the turn order. Fine for local, trusted-network play.
- **Strict turn order** — players act in a fixed sequence. The server is the sole source of truth; browsers are passive renderers driven entirely by WebSocket broadcasts (no client-side game logic beyond disabling input when it isn't your turn).
- **WebSocket protocol** (`server/src/ws/hub.js`): on connect, the server sends a `sync` message with the full current state (roster, session status, turn order, recent turns). After that, small events keep everyone in sync: `roster:updated`, `session:started`, `turn:thinking`, `narration:new`, `turn:changed`, plus `error` / `error:not-your-turn` sent only to the offending client. Clients send `player:action { character, text }`.
- **Turn engine** (`server/src/engine/turnEngine.js`): validates the action is from the character whose turn it is, broadcasts `turn:thinking` (this also serializes DM calls so markdown files are never written concurrently), calls the DM module, appends the exchange to `log.md`, applies any character/story updates, auto-advances `currentTurnIndex`, and broadcasts the result. **The server decides when a turn ends — the DM never does.**
- **Game state as markdown** (`server/src/state/`), all via `gray-matter` (YAML frontmatter + prose body):
  - `game-state/world.md` — generated once at game start, rarely touched after
  - `game-state/story.md` — premise/quests plus a capped, DM-appended "Story So Far" bullet list (compressed long-term memory)
  - `game-state/state.md` — live turn state (`sessionStatus`, `turnOrder`, `currentTurnIndex`, `turnNumber`), mirrored in memory by `engine/gameState.js` and rewritten in full on every turn
  - `game-state/characters/<slug>.md` — one file per character (stats, hp, inventory, backstory); `state/characters.js#applyCharacterUpdate` patches these from DM output
  - `game-state/log.md` — append-only transcript, one `## Turn N — <name>` block per turn; never rewritten, only appended. `state/log.js#readRecentTurns` reconstructs a bounded "recent turns" tail from this file (used both for WS sync and for the DM's per-turn context budget — the full log is never resent).
  - This directory is gitignored except for `.gitkeep` placeholders; it's runtime data, not source.
- **DM/Ollama integration** (`server/src/ollama/dm.js`): currently a stub (Milestone 4) that echoes the action back — real Ollama calls and the structured-output convention (narration + trailing fenced JSON block with optional character/story/scene updates, parsed fail-soft) are Milestone 5, not yet implemented. The function signature (`generateTurnResponse({ character, action, gameStateDir }) => { narration, updates }`) is already the shape the real implementation will fill in, so `turnEngine.js` won't need to change.

## Module map

- `server/src/engine/turnEngine.js` — turn order enforcement and auto-advance
- `server/src/engine/gameState.js` — in-memory mirror of `state.md`, load/save
- `server/src/ollama/dm.js` — DM prompt building and response handling (stub today)
- `server/src/state/markdown.js` — gray-matter based frontmatter read/write helpers shared by all state files
- `server/src/state/sections.js` — helpers for reading/writing a specific `## Heading` section or bullet list within a markdown body (used for "Story So Far" and character "Notes")
- `server/src/ws/hub.js` — WebSocket connection registry, sync-on-connect, and broadcast/send
- `client/src/state/gameStore.jsx` — client-side React Context + reducer driven entirely by WS message types

## Status

Milestones 1–4 (scaffolding, markdown state layer, character creation, turn engine with a stubbed DM) are implemented and verified. Milestone 5 (real Ollama integration) is next — see the plan file for the full remaining build order.
