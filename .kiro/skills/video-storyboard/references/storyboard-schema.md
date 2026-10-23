# storyboard.json schema

```jsonc
{
  "title": "string — working title",
  "platform": "short | reel | youtube | story | ig-feed | ig-square",
  "totalSeconds": 0, // filled/overwritten after voiceover measures audio
  "music": "assets/bg.mp3 | null",
  "musicGainDb": -22, // duck under narration

  // Per-VIDEO art direction — derived from the topic. This is what makes each
  // video look distinct. Mirror palette/font into config.ts theme.
  "style": {
    "genre": "tech-explainer | finance | fitness | food | story | product | news | education | hype",
    "mood": "calm | premium | punchy | playful | serious | cinematic",
    "palette": {
      "bg": "#0B0B0F",
      "fg": "#FFFFFF",
      "accent": "#FF3366",
      "accent2": "#22D3EE", // optional
    },
    "font": "Inter, system-ui, sans-serif", // match personality to genre
    "fontWeightDisplay": 900,
    "motionPersonality": "snappy | smooth | cinematic", // drives spring/ease choice
    "transitionFamily": "cut | fade | slide | wipe | glitch",
    "pacing": "fast | medium | slow", // informs default scene durations
    "captionStyle": "karaoke | block | minimal",
  },

  "scenes": [
    {
      "id": "s1",
      "template": "title | image | bullets | quote | broll | lower-third | cta | number | steps | lottie",
      "narration": "Exact words the voice will say in this scene.",
      "durationSec": 3.2, // estimate now; overwritten by real audio length
      "asset": "assets/city.jpg", // or null for typographic/graphic scenes
      "motion": "kenBurns | slideUp | fade | popWords | zoomIn | countUp | drawPath | none",
      "transition": "cut | fade | slide | wipe | clockWipe | none", // transition INTO this scene
      "text": {
        // on-screen text (may differ from narration)
        "heading": "Big headline",
        "sub": "optional subhead",
        "bullets": ["point one", "point two"],
        "value": "87%", // for the `number` template
      },
      "lottie": "assets/confetti.json", // for the `lottie` template
      "captions": true, // show word-synced captions over this scene
    },
  ],
}
```

The `style` block is per-video and topic-driven — change it every time to fit the subject. Scenes should use a **mix** of templates/motions (not the same one repeated) while staying inside the one chosen motion personality and palette.

## Rules

- `narration` must be the verbatim spoken text — captions are generated from the audio of this exact text, so any mismatch desyncs them.
- `text.heading` / `bullets` are the on-screen graphics and can be a condensed version of the narration.
- `asset` paths are relative to the `video-studio/` project root.
- Keep `id`s stable (`s1`, `s2`, …) so re-runs can match existing audio files `narration/s1.wav`.
- A scene with `"narration": ""` is allowed (silent b-roll / music-only); give it an explicit `durationSec`.

## Minimal example (a 3-scene Short)

```json
{
  "title": "3 Git tips",
  "platform": "short",
  "totalSeconds": 0,
  "music": "assets/lofi.mp3",
  "musicGainDb": -22,
  "scenes": [
    {
      "id": "s1",
      "template": "title",
      "narration": "Three git tricks that save me every single day.",
      "durationSec": 2.6,
      "asset": null,
      "motion": "popWords",
      "text": { "heading": "3 Git Tricks", "sub": "you'll actually use" },
      "captions": true
    },
    {
      "id": "s2",
      "template": "bullets",
      "narration": "First, git switch dash c to make and jump to a new branch in one step.",
      "durationSec": 3.4,
      "asset": null,
      "motion": "slideUp",
      "text": {
        "heading": "1 · Fast branches",
        "bullets": ["git switch -c feature"]
      },
      "captions": true
    },
    {
      "id": "s3",
      "template": "cta",
      "narration": "Follow for one dev tip a day.",
      "durationSec": 2.0,
      "asset": null,
      "motion": "fade",
      "text": { "heading": "Follow for daily tips", "sub": "" },
      "captions": true
    }
  ]
}
```
