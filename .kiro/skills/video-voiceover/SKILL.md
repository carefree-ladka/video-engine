---
name: video-voiceover
description: Generate narration audio from storyboard.json using a pluggable TTS provider — free local voice (macOS say or Piper) by default, or ElevenLabs when an API key is set. Produces one wav per scene plus measured durations. Use after the storyboard is approved and before captions/render.
---

# video-voiceover — storyboard → narration audio

Stage 3. Turn each scene's `narration` into an audio file, then measure real durations and write them back into `storyboard.json`.

## Providers (set in config.ts → voice.provider)

### local — free, offline (default)

- **macOS `say`** (zero setup):
  ```bash
  say -o narration/s1.aiff "narration text"
  ffmpeg -y -i narration/s1.aiff -ar 44100 -ac 1 narration/s1.wav
  ```
- **Piper** (better quality, cross-platform): download a voice model (`.onnx` + `.json`), then:
  ```bash
  echo "narration text" | piper --model en_US-amy-medium.onnx --output_file narration/s1.wav
  ```

### elevenlabs — premium (opt-in)

Requires `ELEVENLABS_API_KEY` in `.env`. Never print the key. Request per scene:

```ts
const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: scene.narration,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  },
);
// res.body is audio/mpeg -> write narration/s1.mp3, then convert to wav with ffmpeg.
```

Handle non-200 responses (quota/invalid key) by reporting the error and offering to fall back to the local provider.

## Language & voice selection

For non-English or Hinglish, pick the voice by language (see the video-localization skill):

- **ElevenLabs** — keep `eleven_multilingual_v2`; it speaks Hindi and code-switches within a line. Best quality for Hindi/Hinglish. Choose a per-language voice id.
- **macOS `say`** — Hindi voice is `Lekha`: `say -v Lekha -o narration/s1.aiff "..."`. English uses the default voice.
- **Piper** — use a language-matched model; Hindi models are limited, prefer ElevenLabs for production Hindi.
  Pass the narration text as written (Devanagari or Hinglish). If the active provider doesn't support the language, fall back and tell the user. For multi-version output, generate one narration set per language into `narration/<lang>/`.

## Measure durations (drives all timing)

For each produced file, read the real length with ffprobe and write it back:

```bash
ffprobe -v error -show_entries format=duration -of default=nk=1:noprint_wrappers=1 narration/s1.wav
```

Update each scene's `durationSec` and set `storyboard.totalSeconds` to the sum (plus any inter-scene padding). This is what makes audio and visuals line up.

## Output

- `video-studio/narration/<sceneId>.wav` (16-bit PCM; also keep a 16 kHz mono copy if the captions stage wants it).
- Updated `storyboard.json` with real `durationSec` and `totalSeconds`.
- A single concatenated `narration/full.wav` (concat in scene order) for the Remotion audio track and for Whisper:
  ```bash
  ffmpeg -y -f concat -safe 0 -i list.txt -c copy narration/full.wav
  ```

Skip re-generating a scene whose narration text is unchanged (compare against a stored hash) to save time and ElevenLabs quota. Then proceed to video-captions.
