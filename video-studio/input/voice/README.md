# Your cloned voice (F5-TTS)

Drop your reference recording here so F5-TTS can clone your voice.

## What to add
1. `reference.wav` — a clean recording of **you** speaking, 8–15 seconds.
   - Quiet room, no music/background, one continuous take.
   - Speak the way you want the videos to sound: calm, smooth, with natural pauses.
   - Mono or stereo WAV, any sample rate (the pipeline resamples).
2. `reference.txt` — the **exact transcript** of what you said in `reference.wav`
   (verbatim, with punctuation). F5-TTS matches timing to this text, so accuracy matters.

Example `reference.txt`:
```
Hey, in this video we'll break down a tricky concept, step by step, so it finally clicks.
```

## How it's used
Run the pipeline with the F5 provider:
```
npm run make -- en --f5
```
Every scene's narration is then spoken in your cloned voice. If F5 can't run
(missing model, no torch, etc.) the run STOPS with a clear error — it will never
silently swap in a robotic voice.

## Tips for a human, smooth result
- Record calmly with natural pauses; the clone inherits your pacing and tone.
- Keep the clip free of filler ("um", long silences at the start/end).
- A 10–12s clip usually clones better than a 5s one.
