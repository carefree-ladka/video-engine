# TTS Provider Guide

This video studio supports **4 TTS providers**. Choose based on your needs:

## Quick Comparison

| Provider | Speed | Quality | Voice | Setup | Best For |
|----------|-------|---------|-------|-------|----------|
| **F5-TTS** | 🐌 Slow | ⭐⭐⭐⭐⭐ Natural | Your cloned voice | Python + models | Personal brand, natural flow |
| **Edge TTS** | ⚡ Fast | ⭐⭐⭐⭐ Good | 400+ neural voices | Just npm | Quick videos, variety |
| **ElevenLabs** | ⚡ Fast | ⭐⭐⭐⭐⭐ Excellent | 100+ voices | API key + $$ | Professional content |
| **macOS say** | ⚡⚡ Very fast | ⭐⭐ Basic | Built-in voices | None | Testing, offline |

---

## How to Choose Provider

### Method 1: Set in `.env` (Persistent)

Edit `.env` and set `TTS_PROVIDER`:

```bash
# Options: f5 | edge | eleven | say
TTS_PROVIDER=edge
```

Then just run:
```bash
npm run make -- en
```

### Method 2: CLI Flag (Override)

CLI flags override `.env` setting:

```bash
npm run make -- en --f5       # Use F5-TTS (your cloned voice)
npm run make -- en --edge     # Use Edge TTS
npm run make -- en --eleven   # Use ElevenLabs
npm run make -- en --say      # Use macOS say
```

---

## 1. F5-TTS (Your Cloned Voice) ⭐ BEST QUALITY

**When to use:** Personal brand videos where consistency and natural human voice matters.

**Setup:**
1. Record 10-15 seconds of your voice: `input/voice/me.mp3`
2. Run setup: `./scripts/install-f5-python.sh`
3. Reference audio auto-converted to `reference.wav`

**Configuration (`.env`):**
```bash
TTS_PROVIDER=f5
```

**Settings** (in `src/config.ts`):
- `speed: 0.92` - Slightly slower for natural pacing
- `scenePauseMs: 350` - Breathing room between scenes
- `nfe: 32` - Quality (higher = better but slower)

**Pros:**
- ✅ YOUR actual voice (personal brand)
- ✅ Most natural, human-like
- ✅ Free, offline, no limits
- ✅ Best for educational content

**Cons:**
- ❌ Slow (8 scenes = ~2-3 minutes)
- ❌ Python setup required
- ❌ Only one voice (yours)

---

## 2. Edge TTS (Microsoft Neural Voices) 🚀 FASTEST

**When to use:** Quick turnaround, need variety, testing, or trying different voices.

**Setup:**
```bash
npm install  # Already includes node-edge-tts
```

**Configuration (`.env`):**
```bash
TTS_PROVIDER=edge
EDGE_TTS_VOICE=en-US-GuyNeural
EDGE_TTS_RATE=+0%       # -50% to +100%
EDGE_TTS_PITCH=+0%      # Adjust pitch
EDGE_TTS_VOLUME=+0%     # Adjust volume
```

**Popular Voices:**
- `en-US-GuyNeural` - Male, natural (default)
- `en-US-AriaNeural` - Female, clear
- `en-US-JennyNeural` - Female, friendly
- `en-US-ChristopherNeural` - Male, professional
- `en-GB-RyanNeural` - Male, British
- `en-IN-NeerjaNeural` - Female, Indian accent

Browse all: https://speech.microsoft.com/portal/voicegallery

**Pros:**
- ✅ Very fast (8 scenes = ~10 seconds)
- ✅ 400+ neural voices in 100+ languages
- ✅ Free, no API key
- ✅ Word-level timestamps built-in
- ✅ Good quality

**Cons:**
- ❌ Not your personal voice
- ❌ Slightly less natural than F5/Eleven
- ❌ Requires internet connection

---

## 3. ElevenLabs (Premium Quality)

**When to use:** Professional content, need highest quality, have budget.

**Setup:**
1. Get API key: https://elevenlabs.io/app/settings/api-keys
2. Add to `.env`:
```bash
TTS_PROVIDER=eleven
ELEVENLABS_API_KEY=your_key_here
```

**Configuration:**
Voice IDs are in `src/config.ts` under `VOICE_BY_LANG`.

**Pros:**
- ✅ Highest quality commercial TTS
- ✅ 100+ premium voices
- ✅ Voice cloning available (paid)
- ✅ Fast generation

**Cons:**
- ❌ Requires paid API key
- ❌ Usage costs money
- ❌ Not your personal voice (unless cloned)

---

## 4. macOS say (Fallback)

**When to use:** Quick testing, offline work, or as automatic fallback.

**Setup:**
None - built into macOS.

**Configuration (`.env`):**
```bash
TTS_PROVIDER=say
```

**Voices** (in `src/config.ts`):
- `Aman` - Indian male accent (English)
- `Lekha` - Indian female accent (Hindi)

**Pros:**
- ✅ No setup, always works
- ✅ Offline, no internet needed
- ✅ Free, no limits
- ✅ Very fast

**Cons:**
- ❌ Robotic, unnatural
- ❌ Limited voices
- ❌ Not suitable for publishing

---

## Recommended Workflow

### For Publishing (Production)
```bash
# Use your cloned voice for authenticity
TTS_PROVIDER=f5
npm run make -- en
```

### For Quick Testing
```bash
# Test with Edge TTS (fast)
npm run make -- en --edge
```

### When Internet is Down
```bash
# Fallback to macOS say
npm run make -- en --say
```

---

## Troubleshooting

### Edge TTS fails with network error
- Your network may be blocking Microsoft's TTS service
- Try a VPN or different network
- Fallback: Use `--say --allow-fallback`

### F5-TTS fails
- Check Python setup: `npm run check-f5`
- Verify `input/voice/reference.wav` exists (run install script)
- Check `.env` has correct `F5_PYTHON` path

### ElevenLabs fails
- Verify API key is valid
- Check your ElevenLabs account has credits
- Fallback happens automatically to macOS say

---

## Examples

```bash
# Generate with F5 (your voice)
npm run make -- en --f5

# Generate with Edge TTS (fast)
npm run make -- en --edge

# Generate with specific Edge voice
EDGE_TTS_VOICE=en-US-AriaNeural npm run make -- en --edge

# Generate with faster speech rate
EDGE_TTS_RATE=+20% npm run make -- en --edge

# Test quickly with macOS say
npm run make -- en --say
```
