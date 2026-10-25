export type Platform =
  | "youtube"
  | "short"
  | "reel"
  | "story"
  | "ig-feed"
  | "ig-square";

export const PRESETS: Record<
  Platform,
  { width: number; height: number; fps: number; maxSeconds: number }
> = {
  youtube: { width: 1920, height: 1080, fps: 30, maxSeconds: 0 },
  short: { width: 1080, height: 1920, fps: 30, maxSeconds: 60 },
  reel: { width: 1080, height: 1920, fps: 30, maxSeconds: 90 },
  story: { width: 1080, height: 1920, fps: 30, maxSeconds: 60 },
  "ig-feed": { width: 1080, height: 1350, fps: 30, maxSeconds: 60 },
  "ig-square": { width: 1080, height: 1080, fps: 30, maxSeconds: 60 },
};

// Per-language voice map.
// - sayVoice: macOS `say` voices (free/offline fallback)
// - elevenlabsVoiceId: ElevenLabs public voice IDs (change to taste at elevenlabs.io/voice-library)
export const VOICE_BY_LANG: Record<
  string,
  { sayVoice: string; elevenlabsVoiceId: string }
> = {
  // sayVoice: offline macOS Indian-accent voices (Aman/Lekha) — free, work on restricted networks.
  // elevenlabsVoiceId: a free-tier premade voice ("Liam"); Indian ElevenLabs voices (Viraj etc.)
  // are library voices that require a PAID ElevenLabs plan to use via the API.
  en: { sayVoice: "Aman", elevenlabsVoiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  hi: { sayVoice: "Lekha", elevenlabsVoiceId: "TX3LPaxmHKxFdv7VOQHJ" },
};

export const ELEVENLABS_MODEL = "eleven_multilingual_v2";

// F5-TTS cloned-voice provider (local, open-source). Uses your own recording.
export const F5 = {
  refAudio: "input/voice/reference.wav",
  refTextFile: "input/voice/reference.txt",
  python: process.env.F5_PYTHON || "python3", // set F5_PYTHON to a 3.11-3.13 interpreter
  script: "scripts/f5_infer.py",
  speed: 0.92, // slightly slower = more natural, human-like pacing
  nfe: 32, // flow-matching steps; higher = cleaner, slower
  scenePauseMs: 350, // longer breathing gap between scenes for natural flow
};

// Edge TTS settings (Microsoft's free neural voices)
export const EDGE_TTS = {
  voice: process.env.EDGE_TTS_VOICE || "en-US-GuyNeural",
  rate: process.env.EDGE_TTS_RATE || "+0%", // -50% to +100%
  pitch: process.env.EDGE_TTS_PITCH || "+0%", // adjust voice pitch
  volume: process.env.EDGE_TTS_VOLUME || "+0%", // adjust volume
};

// Whisper per language — non-English needs a multilingual model (NOT the .en ones).
export const WHISPER_BY_LANG: Record<
  string,
  { model: string; language: string }
> = {
  en: { model: "base.en", language: "en" },
  hi: { model: "base", language: "hi" },
};

// Pronunciation lexicon: code-ish tokens -> how TTS should say them. Applied to
// the spoken text only (not captions / on-screen text). Extend as needed.
// For a one-off, set a scene's `say` field to override the whole line's audio
// while `narration` stays as the caption/display text.
export const PRONUNCIATION: Record<string, string> = {
  "dict.fromkeys": "dict from keys",
  fromkeys: "from keys",
  "str.join": "string join",
  "os.path": "os path",
  kwargs: "kw args",
  argv: "arg v",
  nums: "numbers",
  arr: "array",
  idx: "index",
  len: "len",
  regex: "reg ex",
  async: "a sink",
  nginx: "engine x",
  jwt: "J W T",
  sql: "sequel",
  cli: "C L I",
};
