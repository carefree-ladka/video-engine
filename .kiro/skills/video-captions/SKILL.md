---
name: video-captions
description: Generate word-level, time-synced captions from narration audio using Whisper.cpp via @remotion/install-whisper-cpp, producing captions.json for animated on-screen subtitles and an optional .srt. Use after voiceover and before render. For TikTok/Reel/Short style karaoke captions.
---

# video-captions — narration → word-synced captions

Stage 4. You already have the narration text, so Whisper's job here is precise **timing** (per-word start/end) for animated captions. Uses Whisper.cpp through Remotion's wrapper.

## Install (first run only)

```ts
import {
  installWhisperCpp,
  downloadWhisperModel,
} from "@remotion/install-whisper-cpp";
import path from "path";

const whisperPath = path.join(process.cwd(), "whisper.cpp");
await installWhisperCpp({ to: whisperPath, version: "1.5.5" }); // 1.5.5+ required for token-level timestamps
await downloadWhisperModel({ folder: whisperPath, model: "medium.en" }); // or "small.en" for speed, "large-v3" for accuracy
```

## Prepare audio

Whisper.cpp needs **16 kHz mono WAV**. Convert the concatenated narration:

```bash
ffmpeg -y -i narration/full.wav -ar 16000 -ac 1 narration/full16k.wav
```

## Language (Hindi / Hinglish / other)

For anything non-English, set the Whisper `language` and use a **multilingual model** — the `.en` models are English-only and garble Hindi:

```ts
await transcribe({
  inputPath: "narration/full16k.wav",
  whisperPath,
  model: "medium",
  language: "hi",
  tokenLevelTimestamps: true,
}); // "large-v3" for best Hindi
```

English keeps `medium.en`. Download the chosen model with `downloadWhisperModel` first. Hinglish transcribes as mixed Devanagari+Latin — fine with the dual-script caption font. See the video-localization skill for voices, fonts, and multi-version output.

## Transcribe → word timings

```ts
import { transcribe, toCaptions } from "@remotion/install-whisper-cpp";

const { transcription } = await transcribe({
  inputPath: "narration/full16k.wav",
  whisperPath,
  model: "medium.en",
  tokenLevelTimestamps: true, // needed for per-word timing
});

const { captions } = toCaptions({ transcription });
// captions: Array<{ text, startMs, endMs, timestampMs, confidence }>
```

## Page the words (TikTok/Reel style)

Don't feed raw words to the renderer — group them into short "pages" of 3–5 words that appear together, which is what reads well on short-form. Use `@remotion/captions`:

```ts
import { createTikTokStyleCaptions } from "@remotion/captions";

const { pages } = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 1200, // ~3–5 words per page; lower = snappier
});
```

## Mark keywords for emphasis

Emphasized words get the accent color / pop in the caption component. Flag the content-bearing words (nouns, numbers, verbs) and skip stopwords:

```ts
const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "are",
  "it",
  "that",
  "this",
  "with",
  "as",
  "at",
  "be",
  "was",
]);
for (const page of pages) {
  for (const tok of page.tokens) {
    const w = tok.text.toLowerCase().replace(/[^a-z0-9%$]/g, "");
    tok.emphasis =
      w.length > 0 && (/[0-9%$]/.test(w) || (!STOP.has(w) && w.length >= 5));
  }
}
```

Keep it sparse — roughly one emphasized word per page, not every word, or the effect is lost. The agent may also honor explicit emphasis cues the user put in the script (e.g. `*word*`).

## Output

Write to `video-studio/captions.json`:

```jsonc
{
  "pages": [
    {
      "startMs": 0,
      "endMs": 1180,
      "tokens": [
        { "text": "Three", "startMs": 0, "endMs": 300, "emphasis": true },
        { "text": "git", "startMs": 300, "endMs": 520 },
        { "text": "tricks", "startMs": 520, "endMs": 900, "emphasis": true },
      ],
    },
  ],
}
```

Also emit `out/captions.srt` (from `captions`) for platforms that accept sidecar subtitles.

## Alignment tips

- Captions come from one continuous `full16k.wav`, so timestamps are on the global timeline — exactly what the `<Captions>` component expects.
- If timing looks off, pass `--dtw` / token-level DTW via transcribe options for more accurate timestamps at a small speed cost.
- Keep the original narration text; if Whisper mishears a rare word (names, acronyms), correct the token `text` while keeping its timing.

Then proceed to video-render.
