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
- (Optional) An `ANTHROPIC_API_KEY` to add Claude Haiku 4.5 / Claude Sonnet 5 as DM model options alongside your local Ollama models — useful if you want faster or higher-quality narration than local inference gives you, at the cost of an internet connection and per-token billing. Get one at [console.anthropic.com](https://console.anthropic.com/) (Settings → API Keys) — **this is separate from a claude.ai Pro/Max subscription**; the Developer API bills its own pay-as-you-go credits (you'll need to add a payment method there) even if you sign in with the same account. Once you have a key: `ANTHROPIC_API_KEY=sk-ant-... npm run dev`. Without it, the Claude options simply don't appear in the model dropdown and nothing else changes.
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

## Playing over the internet with Tailscale Funnel

If your friends aren't on your local network, [Tailscale](https://tailscale.com/) Funnel exposes your server at a public `https://<machine>.<tailnet>.ts.net` URL — friends just open the link, no Tailscale install or account on their end.

**One-time setup:**
1. Install Tailscale and sign in: `curl -fsSL https://tailscale.com/install.sh | sh` then `sudo tailscale up`.
2. Enable HTTPS certificates for your tailnet at [login.tailscale.com/admin/dns](https://login.tailscale.com/admin/dns) — Funnel requires this.

**Each time you want to host:**
```bash
npm run build && npm run start   # single-port production server, port 3001
scripts/funnel.sh on             # prints the public URL to share
```
When you're done:
```bash
scripts/funnel.sh off
```
`scripts/funnel.sh status` shows whether Funnel is currently on.

Dungeon.ai has no login system (see below) — Funnel makes that URL genuinely public for as long as it's on, so turn it off when the session's over.

## How it works

1. **Create characters** — each player opens the app, picks a class from a dropdown, and can either type a name or click 🎲 to generate a random one, roll stats, and either write a backstory or click ✨ to have the DM generate one for them.
2. **Start the game** — once at least one character exists, the host clicks "Start Game." The DM generates a world (setting, factions), a connected map of 4-6 named locations, a story (premise, main quest, and its own private plan for how the adventure should unfold), and an opening scene — this takes 10-20 seconds — then welcomes the party before play begins. Turn order is set from the order characters were created.
3. **Play** — players take turns typing what their character does. The current player's browser is the only one that can send an action; everyone else sees a live narration log update in real time as the DM (Ollama) responds and the turn passes to the next player. If you ran the TTS setup step, the DM's narration is also read aloud in a deep narrator voice — toggle it off any time with the 🔊 button, or open ⚙️ next to it to change the voice or its speed (see [Voice settings](#voice-settings) below).

A "DM model" dropdown (visible in both the lobby and in-game) lists every model you have pulled in Ollama, plus Claude Haiku 4.5 / Claude Sonnet 5 if you've set an `ANTHROPIC_API_KEY` (see [Prerequisites](#prerequisites)), and lets anyone switch which one is powering the DM, any time — including mid-game. It's a shared setting everyone sees, since there's only one DM for the whole session.

There's no login system — a browser "claims" whichever character it's playing (remembered locally), which only really matters if two people are sharing one screen. This is meant for a small group of trusted players on a local network, not the open internet.

Combat, skill checks (persuasion, stealth, perception, lockpicking, and the like), and item use are resolved with real dice server-side — the DM narrates the outcome, but never invents whether an attack hits or a check succeeds. Player actions stay plain typed text ("I attack the goblin," "I try to sneak past the guard"); the server figures out what kind of action it is and rolls accordingly.

## Voice settings

The ⚙️ button (next to the 🔊/🔇 toggle, in both the lobby and in-game) opens a settings panel with:

- **Voice** — a dropdown of every voice model installed on the server (see [Adding new voice models](#adding-new-voice-models) below). Only one ships by default (`en_GB-alan-medium`).
- **Speed** — a slider from 0.5x to 2x. This isn't just audio played back faster/slower — it's passed to Piper as `--length_scale`, which re-times the actual speech synthesis, so pitch stays natural even at the extremes.

Both are per-browser preferences (saved to that browser's local storage), like the 🔊/🔇 toggle — everyone at the table can pick their own voice and speed independently, since each browser fetches its own narration audio from the server.

### Adding new voice models

`scripts/setup-tts.sh` only installs one default voice. Piper has dozens more, in many languages and accents, at the [piper-voices](https://huggingface.co/rhasspy/piper-voices) model repo on Hugging Face. To add one:

1. Find a voice you like there. Each one is a pair of files, `<voice-id>.onnx` and `<voice-id>.onnx.json` (e.g. `en_US-lessac-medium.onnx` / `.onnx.json`), under a path like `<lang>/<LANG_REGION>/<name>/<quality>/`.
2. Download both files into `vendor/piper/voices/` (create it if it doesn't exist — `scripts/setup-tts.sh` normally does this for you). For example:
   ```bash
   curl -L --fail -o vendor/piper/voices/en_US-lessac-medium.onnx \
     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
   curl -L --fail -o vendor/piper/voices/en_US-lessac-medium.onnx.json \
     https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
   ```
3. That's it — no server restart needed. The server scans `vendor/piper/voices/` fresh every time the settings panel opens, so the new voice just shows up in the dropdown next time you (re)open it.

The server's *default* voice (used until a browser picks something else, and by anyone who hasn't opened the settings panel) is set by the `PIPER_VOICE` environment variable — point it at any `.onnx` file you've installed, e.g. `PIPER_VOICE=vendor/piper/voices/en_US-lessac-medium.onnx npm run dev`.

## Pre-built scenarios

Instead of "Start Game" (where the DM improvises a whole world on the spot), the Lobby also offers a dropdown of pre-built **scenarios** — a complete world, map, cast of enemies/NPCs, and quest, written in advance. Pick one and click "Start Scenario." A worked example, `scenarios/goblin-warren/`, ships with the repo.

### Designing a new scenario with Claude Code

This repo includes a Claude Code skill, `dungeon-scenario-designer`, that writes new scenarios for you. From a Claude Code session in this repo, just ask for one, e.g.:

```
Design a scenario for Dungeon.ai about a haunted lighthouse.
```

Claude will pick up the `dungeon-scenario-designer` skill automatically (any request to design/create a scenario, campaign, adventure, or quest for Dungeon.ai triggers it) and write a complete bundle to `scenarios/<slug>/` — a world, a connected map, 3-5 enemies/NPCs including a boss, a main quest with explicit win conditions, and an opening narration — all in the exact file format the game already reads, so it's playable immediately with no extra setup. Once it's done, restart the server (or just refresh the Lobby) and the new scenario appears in the picker.

You can also invoke the skill directly by name (`/dungeon-scenario-designer`) if you want to steer it more explicitly, e.g. with a genre, tone, or party size in mind. See `.claude/skills/dungeon-scenario-designer/SKILL.md` for exactly what it does, and `.claude/skills/dungeon-scenario-designer/references/schema.md` for the underlying file format if you ever want to write or tweak a scenario by hand.

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
  - `world.md` — the generated setting and factions (lore/tone)
  - `map.md` — the persistent, connected map the DM navigates the party through: named locations, how they connect, and a quest hook tied to each one. Updates as the party travels.
  - `story.md` — premise, main quest, the DM's own private plan for the story arc, and a running "story so far" summary
  - `state.md` — whose turn it is and what's currently happening
  - `characters/<name>.md` — one file per character sheet
  - `log.md` — the full play transcript, one turn at a time

Turns are strict and server-enforced: only the player whose turn it is can act, and the server always advances to the next player once the DM has responded — the DM never decides when a turn ends. Only one game runs at a time (no multiple concurrent sessions/rooms).

For the full design rationale, the WebSocket message protocol, and the build roadmap, see `CLAUDE.md`.

## Project status

Character creation, live multiplayer sync, the turn engine, real Ollama-powered DM narration, a generated opening scene at game start, DM voice via local TTS, deterministic combat/skill-check/item-use rules, persistent inventory and status effects, and pre-built scenarios (plus the Claude Code skill that authors them) are all working end-to-end. Turns take roughly 10–15 seconds with the default model — this is expected with local inference.
