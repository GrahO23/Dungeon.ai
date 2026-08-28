# Dungeon.ai

A locally-hosted, multiplayer Dungeons & Dragons style game. Players create characters in a browser, then play through a story narrated by a local LLM (via [Ollama](https://ollama.ai/)) acting as Dungeon Master. Players take turns typing what they want to do; the DM narrates what happens. All game state — the world, the story, character sheets, and the full transcript — is saved locally as plain markdown files.

No cloud services, no database: everything runs on your own machine and can be read/edited by hand.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Ollama](https://ollama.ai/) installed and running locally, with a general-purpose chat model pulled, e.g.:
  ```
  ollama pull qwen3:8b
  ```
  Prefer a general instruction-tuned/chat model over a coder-specialized one (like `qwen2.5-coder`) — it narrates a story much better. `qwen3:8b` is the current default (a good balance of speed and quality); `qwen3:14b` narrates slightly better but takes noticeably longer per turn — set `OLLAMA_MODEL=qwen3:14b` if you'd rather trade speed for quality.
- (Optional, for the DM's voice) Run once:
  ```
  bash scripts/setup-tts.sh
  ```
  This downloads [Piper](https://github.com/rhasspy/piper), a free local text-to-speech engine, plus a voice model (~90MB total). No API keys, no cloud calls — it runs as a subprocess alongside Ollama. If you skip this step, the game works exactly the same, just without narration being read aloud.

## Setup

```bash
npm install
```

## Running it

**Development** (server + client with hot reload):
```bash
npm run dev
```
Open `http://localhost:5173`. Everyone playing on the same network can connect to your machine's address on that port.

**Production-style local run** (single process, single port):
```bash
npm run build
npm run start
```
Open `http://localhost:3001`.

## How it works

1. **Create characters** — each player opens the app, fills in a name, class, and optionally rolls stats or writes a backstory.
2. **Start the game** — once at least one character exists, the host clicks "Start Game." The DM generates an opening scene and premise (this takes a few seconds) and welcomes the party before play begins. Turn order is set from the order characters were created.
3. **Play** — players take turns typing what their character does. The current player's browser is the only one that can send an action; everyone else sees a live narration log update in real time as the DM (Ollama) responds and the turn passes to the next player. If you ran the TTS setup step, the DM's narration is also read aloud in a deep narrator voice — toggle it off any time with the 🔊 button.

There's no login system — a browser "claims" whichever character it's playing (remembered locally), which only really matters if two people are sharing one screen. This is meant for a small group of trusted players on a local network, not the open internet.

## Architecture

```
Browser (React) <--REST--> Express API (character creation, start game)
Browser (React) <--WS----> Game Engine (turn queue, in-memory state) <--fs--> game-state/*.md
                                    |
                                    v
                          Ollama client --HTTP--> localhost:11434
```

- **`server/`** — Express + WebSocket (`ws`) backend. Serves the API, runs the turn engine, and talks to Ollama.
- **`client/`** — React + Vite frontend. A Lobby view for character creation, a Game view once play starts. Purely a renderer of whatever the server broadcasts over WebSocket — no game logic lives in the browser.
- **`game-state/`** — the actual game, as markdown files (gitignored — this is runtime data, regenerated per playthrough, not source code):
  - `world.md` — the generated setting, regions, factions
  - `story.md` — premise, quests, and a running "story so far" summary
  - `state.md` — whose turn it is and what's currently happening
  - `characters/<name>.md` — one file per character sheet
  - `log.md` — the full play transcript, one turn at a time

Turns are strict and server-enforced: only the player whose turn it is can act, and the server always advances to the next player once the DM has responded — the DM never decides when a turn ends. Only one game runs at a time (no multiple concurrent sessions/rooms).

For the full design rationale, the WebSocket message protocol, and the build roadmap, see `CLAUDE.md`.

## Project status

Character creation, live multiplayer sync, the turn engine, real Ollama-powered DM narration, a generated opening scene at game start, and DM voice via local TTS are all working end-to-end. Turns take roughly 10–15 seconds with the default model — this is expected with local inference.
