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
├── .env                       # your local secrets (gitignored; loaded by the pipeline)
└── video-studio/              # the Remotion project
    ├── .env.example           # environment variable template
    ├── input/                 # storyboard + caption + brand JSON (en / hi)
    ├── public/narration/      # generated narration audio (gitignored)
    ├── scripts/               # F5-TTS setup + inference helpers
    ├── src/
    │   ├── config.ts          # platform presets, voice map, whisper models
    │   ├── mcp/               # MCP server exposing the pipeline as tools
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

# create your local env file at the repo root from the template (run from video-studio/)
cp .env.example ../.env
# then edit ../.env and set your own values (see Configuration below)
```

> The pipeline loads env vars from the repo-root `.env` (one level above
> `video-studio/`). The template lives at `video-studio/.env.example`.

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

## Sound & music

Every video gets a soft background music bed plus scene-transition whooshes and
optional in-scene accent sounds (pop, click, tick, ding, whoosh, swoosh, riser).
All of it is low and subtle by default.

- **Central config:** `video-studio/src/audio.config.ts` holds every tunable —
  music volume/fades/ducking, the synthesized-bed recipe, the SFX cue library,
  the master SFX gain, and the auto-transition cue.
- **Zero-asset music with moods:** with no music file present, an ambient pad
  is synthesized with ffmpeg at the exact video length and ducked under the
  voiceover. Pick a mood via `sound.music.mood`: `calm` (default), `warm`,
  `bright`, or `tense`.
- **Bring your own track:** drop a file at `video-studio/input/music/default.<ext>`
  to set a global default, `input/music/<name>.<ext>` and reference it by name
  (`"file": "<name>"`), or set `brand.music` / `sound.music.file` to a path.
- **Custom SFX:** drop `video-studio/input/sfx/<cue>.<ext>` to override any
  built-in cue with your own sound.
- **Per-video overrides from the storyboard** via a top-level `sound` block and
  per-scene `sfx` / `transition` fields:

```jsonc
{
  "sound": {
    "music": { "enabled": true, "volume": 0.07 },
    "sfx": {
      "enabled": true,
      "masterGain": 0.35,
      "autoTransition": { "enabled": true, "cue": "whoosh" },
    },
  },
  "scenes": [
    { "id": "s3", "template": "code", "sfx": { "cue": "pop", "offset": 0.5 } }, // accent when the card lands
    {
      "id": "s4",
      "template": "code",
      "transition": "swoosh", // override the entry whoosh
      "sfx": [
        { "cue": "pop", "offset": 0.5 },
        { "cue": "tick", "offset": 1.4 },
      ],
    }, // multiple accents
  ],
}
```

Precedence is `audio.config.ts` defaults < `brand.json` < storyboard `sound`.
Music is laid down in `finalize.ts`; SFX are mixed in `sfx.ts` (both run
automatically at the end of a render).

## Focus zoom (highlight a region)

Any scene can push the "camera" into a region to highlight a feature — the way
screen-recording editors do — via a `zoom` key. Captions stay fixed and
readable; only the scene visuals scale.

```jsonc
{
  "id": "s3",
  "template": "code",
  // hold a zoom on the code card until the scene ends
  "zoom": { "x": 50, "y": 47, "scale": 1.45, "start": 1.3, "in": 0.6 },
}
```

Fields (percentages / seconds): `x`,`y` focal point in % of the frame (0-100,
default 50/50), `scale` zoom level, `start` when to begin, `in` push-in
duration, optional `hold` + `out` to zoom back out (omit `out` to hold to the
scene end). Two polish touches are on by default while zoomed (set to `0` to
disable): `drift` — a slow extra Ken Burns push-in (default `0.045`) — and
`dim` — a soft vignette darkening the edges toward the focal point (default
`0.32`).

Pass an **array** to pan focus between regions in one scene:

```jsonc
"zoom": [
  { "x": 50, "y": 47, "scale": 1.4, "start": 0.8, "in": 0.5, "hold": 1.4, "out": 0.4 },
  { "x": 66, "y": 47, "scale": 1.7, "start": 2.6, "in": 0.45 }
]
```

Implemented in `video-studio/src/remotion/Zoom.tsx` and applied per scene in
`Video.tsx` (above the captions layer).

## Annotations & callouts

Any scene can draw on-screen callouts to point at things (rendered in frame
space, below the captions). Add an `annotations` array; positions are % of the
frame, timing is scene-local seconds.

```jsonc
"annotations": [
  { "type": "spotlight", "x": 50, "y": 40, "w": 60, "h": 14, "dim": 0.55, "start": 0.3, "dur": 4 },
  { "type": "box", "x": 50, "y": 40, "w": 60, "h": 14, "label": "this part", "start": 0.6 },
  { "type": "arrow", "x": 32, "y": 58, "fromX": 14, "fromY": 76, "start": 1.2 },
  { "type": "underline", "x": 50, "y": 52, "w": 34, "start": 1.6 },
  { "type": "label", "x": 72, "y": 66, "text": "hot", "start": 2.0 },
  { "type": "pointer", "x": 50, "y": 40, "from": "br", "click": true, "start": 2.6, "in": 1.0 }
]
```

Types: `spotlight` (dim everything but a region), `box` (+ optional `label`),
`arrow`, `underline`, `label`, and `pointer` (an animated cursor that moves to a
point and optionally `click`s). Common fields: `start`, `in`, `dur`, `out`,
`color`. Implemented in `src/remotion/Annotations.tsx`.

## Transitions

Set a default with `style.transitionFamily`, or override the transition _into_ a
scene with that scene's `transition` key: `cut`, `fade`, `slide`, `slideup`,
`push`, `pushleft`, `wipe`, `clock`, `flip`, `zoom`. Length is
`style.transitionFrames` (default 9). The custom `zoom`/`push` presentations are
pure CSS (reliable headless); see `src/remotion/transitions.tsx`.

> Note: `transition` selects the **visual** transition; the separate
> `transitionSfx` key overrides the scene-entry whoosh sound.

## Progress bar

Add a retention bar via `style.progressBar`:

```jsonc
"style": { "progressBar": { "position": "top", "thickness": 7 } }
```

`true` also works for defaults (accent colour, top). Fields: `position`
(`top`/`bottom`), `color`, `thickness`, `track`.

## Caption controls

`style.captions` tunes the subtitles: `position` (0..1 from the bottom),
`maxWords` (hard cap — a longer page is windowed to the group containing the
current word), and `style` (`karaoke` | `block` | `minimal`).

## B-roll media

The `broll` template takes real media via `media.src` (resolved from
`video-studio/public/`, e.g. `"assets/clip.mp4"` or `"assets/shot.jpg"`).
Images and video (`.mp4/.mov/.webm/.m4v`) are both supported, with a slow Ken
Burns move (`media.kenBurns`, `media.from`, `media.fit`) and a legible
lower-third.

## Configuration

Platform presets, the per-language voice map, and Whisper models live in `video-studio/src/config.ts`.

Environment variables (set in a root `.env`, see `.env.example`):

| Variable                                                  | Purpose                                                          |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| `TTS_VOICE`                                               | Default TTS voice (e.g. `en-US-AndrewNeural`)                    |
| `TTS_VOICE_RATE` / `TTS_VOICE_PITCH` / `TTS_VOICE_VOLUME` | Optional TTS prosody tuning                                      |
| `ELEVEN_LABS_KEY`                                         | ElevenLabs API key (only if using the ElevenLabs voice provider) |
| `F5_PYTHON`                                               | Path to a Python 3.11–3.13 interpreter for F5-TTS                |

> **Note:** `.env` is gitignored. Never commit real API keys — keep them in your local `.env` only.

## License

Private / unlicensed. Update this section if you intend to open-source the project.
