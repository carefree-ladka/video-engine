# video-engine

A programmatic video studio that turns a storyboard and narration script into fully rendered, caption-synced social videos. Built on [Remotion](https://www.remotion.dev/) (React-based video rendering), with text-to-speech voiceover, automatic caption alignment, and multi-language support.

The project is driven by a set of [Kiro](https://kiro.dev) skills (under `.kiro/skills/`) that cover the full pipeline: storyboarding, brand kit, motion graphics, voiceover, captions, localization, and rendering.

## Features

- **Storyboard-driven** — scenes are defined as JSON; the renderer maps them to Remotion `<Sequence>` blocks.
- **Multi-platform presets** — YouTube (1920×1080), Shorts/Reels/Stories (1080×1920), Instagram feed/square. See `video-studio/src/config.ts`.
- **Multi-language** — ships with English (`en`) and Hindi (`hi`) inputs, with per-language voice and caption models.
- **Flexible voiceover** — macOS `say` (offline, free), [ElevenLabs](https://elevenlabs.io/), or local [F5-TTS](https://github.com/SWivid/F5-TTS) cloned voice.
- **Automatic captions** — word-synced captions via Whisper, with a synthetic-alignment fallback when Whisper is unavailable.
- **Scene templates** — code scenes, diagram scenes, animated backgrounds, and brand-aware safe zones.

## Project layout

```
video-engine/
├── .kiro/                     # Kiro agent + skills driving the pipeline
│   ├── agents/
│   └── skills/                # storyboard, brand-kit, voiceover, captions, render...
├── .env.example               # environment variable template
└── video-studio/              # the Remotion project
    ├── input/                 # storyboard + caption + brand JSON (en / hi)
    ├── public/narration/      # generated narration audio (gitignored)
    ├── scripts/               # F5-TTS setup + inference helpers
    ├── src/
    │   ├── config.ts          # platform presets, voice map, whisper models
    │   ├── pipeline/          # voiceover → captions → render orchestration
    │   └── remotion/          # compositions, scenes, captions, fonts
    └── package.json
```

## Prerequisites

- **Node.js** 18+ and npm
- **ffmpeg / ffprobe** — bundled via `ffmpeg-static` / `ffprobe-static`
- **macOS** if you want the offline `say` voices (optional)
- **Python 3.11–3.13** if you want local F5-TTS cloned voices (optional — see `video-studio/scripts/F5-SETUP.md`)

## Setup

```bash
cd video-studio
npm install

# from the repo root, create your local env file
cp .env.example .env
# then edit .env and set your own values (see Configuration below)
```

## Usage

All commands run from the `video-studio/` directory.

```bash
# Open the Remotion studio (live preview / editing)
npm run studio

# Full pipeline for a language: voiceover -> captions -> render
npm run make -- en          # English
npm run make -- hi          # Hindi

# Options
npm run make -- en --no-captions   # skip caption generation
npm run make -- en --synthetic     # force synthetic caption alignment (skip Whisper)

# Render only (assumes audio/captions already exist)
npm run render

# Verify F5-TTS setup (optional cloned-voice provider)
npm run check-f5
```

Rendered output and generated narration land in `out/` and `public/narration/` respectively (both gitignored).

## Configuration

Platform presets, the per-language voice map, and Whisper models live in `video-studio/src/config.ts`.

Environment variables (set in a root `.env`, see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `TTS_VOICE` | Default TTS voice (e.g. `en-US-AndrewNeural`) |
| `TTS_VOICE_RATE` / `TTS_VOICE_PITCH` / `TTS_VOICE_VOLUME` | Optional TTS prosody tuning |
| `ELEVEN_LABS_KEY` | ElevenLabs API key (only if using the ElevenLabs voice provider) |
| `F5_PYTHON` | Path to a Python 3.11–3.13 interpreter for F5-TTS |

> **Note:** `.env` is gitignored. Never commit real API keys — keep them in your local `.env` only.

## License

Private / unlicensed. Update this section if you intend to open-source the project.
