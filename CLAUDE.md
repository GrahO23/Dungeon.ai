# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dungeon.ai** is a locally-hosted, multiplayer, Dungeons & Dragons style game. Players create characters through a web UI; an Ollama-powered Dungeon Master narrates the game and players interact with it using typed natural language, taking turns in a fixed order. All game state (world, story, characters, turn state, transcript) is persisted as local markdown files rather than a database.

The full design rationale and build plan live in `/home/graham/.claude/plans/structured-dazzling-boot.md` — read it for the "why" behind any of the decisions below.

## Prerequisites

- Node.js 22+
- [Ollama](https://ollama.ai/) running locally (`http://localhost:11434`) with a general-purpose chat model pulled — the current default in `server/src/config.js` is `qwen3:8b`. Avoid coder-specialized models (e.g. `qwen2.5-coder`) for the DM role; they narrate poorly compared to general instruction-tuned models.
- For DM voice: run `bash scripts/setup-tts.sh` once to download the [Piper](https://github.com/rhasspy/piper) TTS binary and a voice model into `vendor/` (gitignored, ~90MB, idempotent — safe to re-run). No Python involved; Piper ships as a standalone binary. Voice is optional — if `vendor/piper/piper` isn't present, `/api/tts` returns 503 and the client just skips playback silently.

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
- **DM/Ollama integration** (`server/src/ollama/`): `client.js` is a thin non-streaming wrapper over `POST /api/generate`; `prompts.js` holds the DM system prompt (which defines the output contract below) and per-turn prompt assembly from story/scene/character/recent-log context; `dm.js#generateTurnResponse({ character, action, gameStateDir, scene })` orchestrates build → call → parse → return `{ narration, updates }`. The model is expected to respond with narration prose followed by an optional fenced ` ```json ` block (`characterUpdates`, `sceneUpdate`, `storyNote`, all optional); parsing is fail-soft — a missing or malformed block just means no updates that turn, never a crash. `turnEngine.js` applies `characterUpdates` via `state/characters.js#applyCharacterUpdate`, `storyNote` via `state/story.js#appendStoryNote`, and `sceneUpdate` into `state.md`. If the Ollama call itself throws (model down, network error), the turn does not advance — the server broadcasts `turn:changed` with the *same* index to un-stick every client's "thinking" state, and the acting player can just try again.
  - Observed latency on this machine: `qwen3:14b` ~15–45s per turn; `qwen3:8b` (current default) ~10–15s with comparable narration quality and reliable structured-update output. `qwen3:14b` remains available via `OLLAMA_MODEL=qwen3:14b` if quality ever needs to be traded back for speed.

## DM voice (Piper TTS)

- `server/src/tts/piper.js#synthesize(text)` spawns the vendored Piper binary (`config.piperBin`, `config.piperVoice`), pipes `text` to stdin, and collects the WAV bytes from stdout — stdout and stderr are kept strictly separate (stderr carries Piper's log lines; mixing them corrupts the WAV).
- `server/src/routes/tts.js` exposes `POST /api/tts { text }` → `audio/wav` bytes. Stateless and decoupled from the turn engine entirely — `turnEngine.js` and `routes/setup.js` don't know TTS exists. The client calls this on its own after receiving narration text, so a slow or failed synthesis can never slow down or break a turn.
- `client/src/api/tts.js#speak(text)` POSTs to `/api/tts`, plays the returned audio via a small in-module queue (so the game-start intro and the first turn's narration, which can arrive close together, play sequentially rather than overlapping).
- `gameStore.jsx` calls `speak()` on every `narration:new` message when `voiceEnabled` (persisted to `localStorage`, default on); the 🔊/🔇 toggle in `Game.jsx` flips it. A TTS failure is caught and logged, never surfaced as a game error.
- Default voice is `en_GB-alan-medium` (deep British male) — chosen for narrator gravitas. Swap via `PIPER_VOICE` env var (must point at a `.onnx` file with a matching `.onnx.json` alongside it; more voices at [huggingface.co/rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices)).

## Module map

- `server/src/engine/turnEngine.js` — turn order enforcement and auto-advance
- `server/src/engine/gameState.js` — in-memory mirror of `state.md`, load/save
- `server/src/ollama/dm.js` — DM prompt building and response handling (stub today)
- `server/src/state/markdown.js` — gray-matter based frontmatter read/write helpers shared by all state files
- `server/src/state/sections.js` — helpers for reading/writing a specific `## Heading` section or bullet list within a markdown body (used for "Story So Far" and character "Notes")
- `server/src/ws/hub.js` — WebSocket connection registry, sync-on-connect, and broadcast/send
- `client/src/state/gameStore.jsx` — client-side React Context + reducer driven entirely by WS message types

## Status

Milestones 1–5 are implemented and verified, plus a scoped version of Milestone 6: `POST /api/setup/start` (`server/src/routes/setup.js`) now calls `ollama/dm.js#generateGameIntro({ characters })` before flipping `sessionStatus` to `playing`. It reuses the same narration-plus-JSON convention as per-turn responses (`INTRO_SYSTEM_PROMPT`/`buildIntroPrompt` in `ollama/prompts.js`), asking for an opening narration (starting "Welcome, adventurers...") plus `{ premise, mainQuest, scene }`. That seeds `story.md`, sets the initial `state.md` scene, and is logged as a special `## Turn 0 — Dungeon Master` entry (no `**Player:**` line — `state/log.js#appendTurn` omits it when `playerText` is empty) so it shows up in the narration log for every client, including ones that connect later via `sync`.

Not yet built from the original Milestone 6 scope: a full `world.md` (regions/factions/setting detail) — right now the "world" is implicit in the intro narration and `story.md`'s premise, not a separately generated document. Add that if the DM needs a bigger persistent setting to stay consistent over a long game.
