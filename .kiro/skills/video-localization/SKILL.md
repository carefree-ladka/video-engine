---
name: video-localization
description: Produce videos in Hindi, English, Hinglish (code-mixed) or other languages, and optionally render the same script as multiple language versions. Handles per-language TTS voice, Whisper transcription language, Devanagari/script-aware fonts, and localized on-screen text. Use whenever the target language is not plain English or the user wants multi-language output.
---

# video-localization — multi-language video (Hindi / English / Hinglish)

Language is a cross-cutting concern touching four stages. Get all four aligned or the video breaks (wrong voice accent, garbled captions, or boxes/tofu where Devanagari should be).

## 1. Decide language mode (ask up front)
- **Single language** — e.g. a Hindi video or an English video.
- **Hinglish (code-mixed)** — Hindi + English mixed in one line (the dominant style for Indian Shorts/Reels). Treat as one track; use a multilingual voice and a font stack covering both scripts.
- **Multi-version** — one script → separate MP4s per language (e.g. `video.en.mp4`, `video.hi.mp4`) to reach both audiences. Translate the script, then run voiceover → captions → render once per language. Keep the same visuals/brand; swap narration, captions, and on-screen text.

Set `config.language` (and `config.languages: string[]` for multi-version). Use BCP-47-ish codes: `en`, `hi`, `hi-Latn` (Hinglish in Latin script).

## 2. Voice (video-voiceover)
Per-language voice selection:
- **ElevenLabs (best for Hindi/Hinglish):** keep `modelId: "eleven_multilingual_v2"` — it speaks Hindi and code-switches within a sentence. Pick a voice that sounds good in the target language; set it per language in config. Pass the text as-is (Devanagari or Hinglish).
- **macOS `say` (free, offline):** Hindi voice is `Lekha` → `say -v Lekha -o out.aiff "..."`. English default voice for `en`. Quality is modest; fine for drafts.
- **Piper (free, offline):** use a language-matched model (e.g. an `en_US` model for English). Hindi Piper models exist but are limited — prefer ElevenLabs for production Hindi.
Map language → voice in `config.voice.byLanguage` (see config note below). If a provider lacks the language, fall back and tell the user.

## 3. Captions (video-captions)
- Set the Whisper **language** explicitly and use a **multilingual model** for anything non-English. The `.en` models (e.g. `medium.en`) are English-only and will fail/garble Hindi.
  ```ts
  await transcribe({ inputPath, whisperPath, model: "medium", language: "hi", tokenLevelTimestamps: true });
  ```
  Recommended models: `medium` or `large-v3` for Hindi (small models drop accuracy on Devanagari). For English keep `medium.en`.
- Hindi words are space-separated, so word-level paging/`createTikTokStyleCaptions` works the same.
- **Hinglish:** Whisper may output Hindi parts in Devanagari and English parts in Latin — that's expected and renders fine with the dual-script font. If the user wrote the script in Latin-script Hinglish and wants captions to stay Latin, prefer using the known script text aligned to Whisper timings rather than Whisper's own text.
- Keyword emphasis: the stopword list is English; for Hindi, emphasize numbers and longer content words and skip common Hindi particles (है, और, का, की, के, में, को, से, पर, कि, यह, वह).

## 4. Fonts (brand / render) — critical for Devanagari
Inter and most Latin fonts cannot render Devanagari (you get blank boxes "tofu"). Use a font stack with a Devanagari-capable font first-or-fallback:
- Good dual/Devanagari fonts (free, Google Fonts): **Hind**, **Mukta**, **Baloo 2**, **Noto Sans Devanagari**, **Tiro Devanagari**.
- Recommended stack: `"Hind, 'Noto Sans Devanagari', Inter, system-ui, sans-serif"` — Devanagari renders via Hind/Noto, Latin via Hind/Inter.
- Load them before render with `@remotion/google-fonts` (e.g. `loadFont()` for `Hind`) or self-host and load via `@remotion/fonts` in `Root.tsx`.
- Devanagari sits taller; give captions a bit more line-height and slightly smaller size than English so matras (vowel marks) aren't clipped by the safe zone.

## 5. On-screen text & translation
- Headings/bullets must be localized too, not just narration. For multi-version, translate on-screen `text` per language and keep layouts flexible (Hindi strings are often longer and taller).
- Keep `narration` verbatim per language so TTS and captions stay in sync.

## Output
- Single/Hinglish: one video as usual, with language-correct voice, captions, and fonts.
- Multi-version: `out/video.<lang>.mp4` per language (+ `captions.<lang>.srt`), same brand and visuals.

## Config note
Extend `config.ts`:
```ts
language: "en" as string,            // active language
languages: ["en"] as string[],       // for multi-version render
voice: {
  provider: "elevenlabs" as "local" | "elevenlabs",
  byLanguage: {
    en: { elevenlabsVoiceId: "Rachel", sayVoice: "Samantha", piperModel: "en_US-amy-medium.onnx" },
    hi: { elevenlabsVoiceId: "<hindi-voice-id>", sayVoice: "Lekha", piperModel: "" },
  },
  modelId: "eleven_multilingual_v2",
},
whisperByLanguage: { en: { model: "medium.en", language: "en" }, hi: { model: "medium", language: "hi" } },
fontStack: "Hind, 'Noto Sans Devanagari', Inter, system-ui, sans-serif",
```
Mirror `fontStack` into the theme/brand fonts so scene templates and captions pick it up.
