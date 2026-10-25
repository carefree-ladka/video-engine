# Storyboard reference

A storyboard is a single JSON file at `input/storyboard.<lang>.json` that fully
describes a video: its format, look, sound, and an ordered list of scenes. The
pipeline (`npm run make -- <lang>`) turns it into narration, captions, and a
rendered MP4.

> Durations are not final in the file — the voiceover step measures each scene
> from its generated audio and rewrites `durationSec` + `totalSeconds`. So the
> numbers you write are just placeholders.

## Minimal example

```jsonc
{
  "title": "My Short",
  "platform": "short",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "style": { "look": "neo-grotesk", "captionStyle": "karaoke" },
  "scenes": [
    { "id": "s1", "template": "hook", "narration": "Here's the hook.",
      "text": { "heading": "Big idea" } },
    { "id": "s2", "template": "cta", "narration": "Follow for more.",
      "text": { "heading": "Follow for daily tips", "sub": "@code2offer" } }
  ]
}
```

---

## Top-level fields

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Video title (used by thumbnails/metadata). |
| `platform` | string | `youtube` · `short` · `reel` · `story` · `ig-feed` · `ig-square`. Sets aspect + max length. |
| `width` / `height` / `fps` | number | Frame size + rate (e.g. 1080×1920 @ 30). |
| `language` | string | e.g. `en`, `hi`. |
| `totalSeconds` | number | Auto-overwritten by the voiceover step. |
| `audio` | string | Auto-set to `narration/<lang>/full.wav`. |
| `style` | object | Look, captions, transitions, progress bar — see below. |
| `sound` | object | Music + SFX — see below. |
| `scenes` | array | The ordered scenes — see below. |

---

## `style`

```jsonc
"style": {
  "look": "neo-grotesk",          // visual identity (see Looks)
  "captionStyle": "karaoke",      // karaoke | block | minimal
  "transitionFamily": "slide",    // default transition between scenes
  "transitionFrames": 9,          // transition length in frames
  "progressBar": { "position": "top", "thickness": 6 },
  "captions": { "position": 0.22, "maxWords": 4, "style": "karaoke" },
  "palette": { "bg": "#0B0F14", "fg": "#F2F5F7", "accent": "#7CF5C4" } // optional override
}
```

- **`transitionFamily`** / per-scene `transition`: `cut` · `fade` · `slide` ·
  `slideup` · `push` · `pushleft` · `wipe` · `clock` · `flip` · `zoom`.
- **`progressBar`**: `true` for defaults, or `{ position:top|bottom, color,
  thickness, track }`.
- **`captions`**: `position` (0..1 up from the bottom), `maxWords` (hard cap —
  a longer page is windowed to the group around the current word), `style`.

### Looks

`code2offer` · `neo-grotesk` · `ultra` · `instrument` · `bold-poster` ·
`broadside` · `coral` · `creative-mode` · `cobalt-grid` · `capsule` ·
`biennale-yellow` · `blockframe` · `blue-professional` · `cartesian` ·
`daisy-days` · `editorial-forest`.

Each look sets background, palette, display/body typefaces, and decorations
(palettes + type mirror the hyperframes.dev design systems). Defined in
`src/remotion/looks.ts`.

---

## `sound`

```jsonc
"sound": {
  "music": { "enabled": true, "mood": "calm", "volume": 0.07 },
  "sfx": {
    "enabled": true,
    "masterGain": 0.35,
    "autoTransition": { "enabled": true, "cue": "whoosh" }
  }
}
```

- **Music**: a soft bed ducked under the voiceover. With no file, an ambient pad
  is synthesized at the video length. `mood`: `calm` · `warm` · `bright` ·
  `tense`. Or drop `input/music/default.<ext>` / reference a name via
  `"file"`.
- **SFX cues**: `pop` · `click` · `tick` · `ding` · `whoosh` · `swoosh` ·
  `riser` (drop `input/sfx/<cue>.<ext>` to override any with your own sound).
- **`autoTransition`** plays a cue at every scene boundary.

Full detail in the root README "Sound & music" section.

---

## Scene — common fields

Every scene supports these (on top of its template-specific `text`):

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | string | Unique id (required). |
| `template` | string | One of the templates below (required). |
| `narration` | string | Spoken by TTS; also drives captions + the measured duration. |
| `say` | string | Overrides what TTS *speaks* (pronunciation) while `narration` stays as the caption/on-screen text. |
| `durationSec` | number | Placeholder; re-measured from audio. |
| `motion` | string | e.g. `kinetic` (per-template). |
| `transition` | string | Visual transition *into* this scene (overrides `style.transitionFamily`). |
| `transitionSfx` | string/obj/`false` | Override/mute the scene-entry whoosh sound. |
| `sfx` | cue / `{cue,gain,offset}` / array | In-scene accent sound(s); `offset` in seconds. |
| `zoom` | object / array | Focus zoom (camera push-in) — see Features. |
| `annotations` | array | On-screen callouts — see Features. |
| `emphasize` | number / array / object | Highlight item(s) in card scenes — see Features. |
| `badge` | string | Small corner badge, e.g. `"2/5"`. |
| `captions` | `false` | Suppress subtitles during this scene (e.g. the CTA). |

---

## Scene templates

| Template | What it is | Key `text` fields |
| --- | --- | --- |
| `hook` | Punchy full-bleed opener | `heading`, `kicker?`, `sub?`, `fill?` (solid/gradient/outline) |
| `title` | Standard title card | `heading`, `kicker?`, `sub?`, `fill?` |
| `bullets` | Numbered list of points | `bullets[]`, `heading?`, `kicker?` — supports `emphasize` |
| `cta` | Closing call to action (click-to-follow animation) | `heading`, `sub?`, `cta?`, `ctaDone?` |
| `code` | Editor window, typewriter reveal | `code[]`, `heading?`, `windowLabel?`, `footnote?`, `fontSize?`/`codeScale?`/`wrap?`, `output?`, `highlights?`, `error?` |
| `diagram` | Row/column of labelled cards | `diagram.boxes[]` (`{title, items?}`), `diagram.accentIndex?` — supports `emphasize` |
| `stat` | One big number | `value`, `kicker?`, `sub?`, `fill?` |
| `chart` | Animated bar / line chart | `chart.data[]` (`{label, value, color?}`), `chart.type?`, `chart.unit?`, `chart.max?` |
| `compare` | Side-by-side panels (tone ✓/✗/•) | `compare.left`, `compare.right` (`{label, tone?, items?, value?}`), `compare.divider?` |
| `tokens` | Animated token/word chips | `tokens[]` |
| `broll` | Full-frame image/video + lower-third | `media.src` (image or `.mp4/.mov/.webm/.m4v`), `media.fit/kenBurns/from`, `heading?`, `caption?` |
| `interstitial` | Short transitional beat | `heading?`, `kicker?` |
| `terminal` | Prompt → command → output | `command`, `output?`, `prompt?`, `heading?`, `windowLabel?` |
| `diff` | One card, git `+`/`-`/context lines | `diff[]` (or `code[]`) lines prefixed `+`/`-`/space |
| `beforeafter` | Two cards: red `-` before, green `+` after | `before.code[]`, `after.code[]`, `before.label?`, `after.label?`, `dimBefore?` |

---

## Features (cross-cutting)

### Focus zoom — push the "camera" into a region
```jsonc
"zoom": { "x": 50, "y": 47, "scale": 1.5, "start": 1.2, "in": 0.6 }
```
`x`/`y` = focal point in % (0-100), `scale` = zoom, `start`/`in`/`hold`/`out`
in seconds (omit `out` to hold to scene end). `drift` (slow Ken Burns, default
0.045) and `dim` (vignette, default 0.32) add polish — set to 0 to disable.
Pass an **array** to pan between regions. Captions stay fixed.

### Annotations — callouts on top of a scene
```jsonc
"annotations": [
  { "type": "spotlight", "x": 50, "y": 40, "w": 60, "h": 14, "dim": 0.55, "start": 0.3, "dur": 4 },
  { "type": "box", "x": 50, "y": 40, "w": 60, "h": 14, "label": "this", "start": 0.6 },
  { "type": "arrow", "x": 32, "y": 58, "fromX": 14, "fromY": 76, "start": 1.2 },
  { "type": "underline", "x": 50, "y": 52, "w": 34, "start": 1.6 },
  { "type": "label", "x": 72, "y": 66, "text": "hot", "start": 2.0 },
  { "type": "pointer", "x": 50, "y": 40, "from": "br", "click": true, "start": 2.6, "in": 1.0 }
]
```
Positions in % of frame; timing in scene-local seconds. Common fields: `start`,
`in`, `dur`, `out`, `color`.

### Emphasize — highlight item(s) in card scenes (`bullets`, `diagram`)
```jsonc
"emphasize": { "item": 5, "at": 2.8, "dimOthers": true }
```
Pops the item (1-based), rings + glows it, and dims the rest — the "the 5th one
will shock you" beat. Shorthand: `5` or `[1, 5]`. The ring appears at `at`
(scene-local seconds; default: when the item reveals), so it looks ordinary
until the reveal.

### Code scene extras
```jsonc
"text": {
  "code": ["evens = [n for n in range(10) if n % 2 == 0]"],
  "codeScale": 1.3,                               // bigger (clamped to fit; use `wrap` to allow wrapping)
  "output": ["[0, 2, 4, 6, 8]"],                  // OUTPUT panel that pops in after typing
  "highlights": [{ "line": 1, "start": 2.0, "color": "#FFD23F" }],  // time-synced line highlight
  "error": { "line": 2, "at": 2.2, "message": "KeyError: 'x'" }     // red line + red error + card shake
}
```
Set `"run": true` on the scene (+ a python/node/bash `windowLabel`) and run
`npm run runcode -- <lang>` to execute the snippet and fill `output` with the
real result.

### Progress bar, badge, caption controls
See `style.progressBar`, the scene `badge` field, and `style.captions` above.

---

## Validate & lint before rendering

```bash
# structural validation runs automatically in voiceover/render; or via MCP:
#   validate_storyboard   (errors/warnings)
#   lint_storyboard       (handle consistency, overflow, length, pacing)
```

An AI agent can author storyboards through the MCP server — see
[`src/mcp/README.md`](src/mcp/README.md) and the root README.

## Related

- Pipeline commands, sound, zoom, transitions, etc.: [`../README.md`](../README.md)
- Look definitions: `src/remotion/looks.ts`
- Scene components: `src/remotion/`
