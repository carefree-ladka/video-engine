import crypto from "node:crypto";

// ===========================================================================
// Central audio configuration
// ---------------------------------------------------------------------------
// One place to tune EVERYTHING you hear in a video:
//   - background music (a soft bed that plays under the whole narration)
//   - scene-transition whooshes + in-scene accent cues (pop / click / ding...)
//
// Defaults are intentionally LOW and subtle. Any storyboard can override per
// video via a top-level `sound` block, and `brand.json` (music / musicVolume)
// is honoured for backwards compatibility. See resolveAudioConfig() below.
// ===========================================================================

export type SfxRecipe = {
  lavfi: string; // ffmpeg lavfi source graph
  af: string; // shaping filter chain (NO gain here — gain is applied at mix)
  gain: number; // the cue's intrinsic relative level (0..1)
};

export interface AudioConfig {
  music: {
    enabled: boolean;
    /** Path (relative to project root) to a music file. null => synthesized bed. */
    file: string | null;
    /** Final loudness of the bed in the mix (kept low so it sits under the VO). */
    volume: number;
    fadeInSec: number;
    fadeOutSec: number;
    /** Sidechain ducking: the bed dips while the voiceover speaks. */
    duck: {
      threshold: number; // 0..1
      ratio: number;
      attack: number; // ms
      release: number; // ms
    };
    /** Final loudness target for the voice+music mix. */
    loudnorm: string;
    /** Zero-asset ambient bed, generated with ffmpeg when no file is supplied. */
    synth: {
      freqs: number[]; // chord tones in Hz (a soft low triad)
      tremoloHz: number; // slow amplitude movement
      tremoloDepth: number; // 0..1
      lowpassHz: number; // soften the top end
      echo: string; // aecho params for a touch of space
      gain: number; // bed level before `volume` is applied
    };
  };
  sfx: {
    enabled: boolean;
    /** Multiplies EVERY cue's gain. The master "how loud are sounds" knob. */
    masterGain: number;
    /** Brick-wall limit on the summed track so nothing clips. */
    limiter: number;
    /** Automatically play a sound at every scene boundary. */
    autoTransition: {
      enabled: boolean;
      cue: string; // which library cue
      gain: number; // relative to the cue's intrinsic gain
      offset: number; // seconds from scene start
      skipFirst: boolean; // no sound before the very first scene
    };
    /** The built-in cue library (override or extend via storyboard.sound.sfx.library). */
    library: Record<string, SfxRecipe>;
  };
}

export const AUDIO: AudioConfig = {
  music: {
    enabled: true,
    file: null,
    volume: 0.07, // very soft
    fadeInSec: 1.5,
    fadeOutSec: 2.0,
    duck: { threshold: 0.03, ratio: 8, attack: 20, release: 320 },
    loudnorm: "loudnorm=I=-14:TP=-1.5:LRA=11",
    synth: {
      freqs: [130.81, 164.81, 196.0], // C3 / E3 / G3 — warm, calm major triad
      tremoloHz: 0.12,
      tremoloDepth: 0.45,
      lowpassHz: 600,
      echo: "aecho=0.8:0.7:180:0.3",
      gain: 0.9,
    },
  },
  sfx: {
    enabled: true,
    masterGain: 0.35, // low — these are accents, not the main event
    limiter: 0.95,
    autoTransition: {
      enabled: true,
      cue: "whoosh",
      gain: 0.9,
      offset: 0,
      skipFirst: true,
    },
    library: {
      pop: {
        lavfi: "sine=frequency=720:duration=0.12",
        af: "afade=t=out:st=0.02:d=0.1",
        gain: 0.5,
      },
      click: {
        lavfi: "sine=frequency=1100:duration=0.05",
        af: "afade=t=out:st=0.01:d=0.04",
        gain: 0.4,
      },
      tick: {
        lavfi: "sine=frequency=1600:duration=0.03",
        af: "afade=t=out:st=0.005:d=0.025",
        gain: 0.35,
      },
      ding: {
        lavfi: "sine=frequency=880:duration=0.6",
        af: "afade=t=out:st=0.06:d=0.54,aecho=0.8:0.6:40:0.3",
        gain: 0.45,
      },
      whoosh: {
        lavfi: "anoisesrc=d=0.55:color=pink:amplitude=0.6",
        af: "highpass=f=350,lowpass=f=3500,afade=t=in:d=0.28,afade=t=out:st=0.28:d=0.27",
        gain: 0.4,
      },
      swoosh: {
        lavfi: "anoisesrc=d=0.35:color=pink:amplitude=0.6",
        af: "highpass=f=500,lowpass=f=4000,afade=t=in:d=0.16,afade=t=out:st=0.17:d=0.18",
        gain: 0.4,
      },
      riser: {
        lavfi: "anoisesrc=d=1.0:color=white:amplitude=0.5",
        af: "highpass=f=400,volume='min(1,t)':eval=frame,afade=t=out:st=0.9:d=0.1",
        gain: 0.35,
      },
    },
  },
};

// Selectable synth-bed "moods" for the zero-asset music. Pick one with
// storyboard.sound.music.mood = "warm" | "calm" | "bright" | "tense".
export const MUSIC_MOODS: Record<string, AudioConfig["music"]["synth"]> = {
  calm: {
    freqs: [130.81, 164.81, 196.0], // C major, mid-low — the default
    tremoloHz: 0.12,
    tremoloDepth: 0.45,
    lowpassHz: 600,
    echo: "aecho=0.8:0.7:180:0.3",
    gain: 0.9,
  },
  warm: {
    freqs: [110.0, 138.59, 164.81], // A minor-ish, lower + rounder
    tremoloHz: 0.1,
    tremoloDepth: 0.4,
    lowpassHz: 520,
    echo: "aecho=0.8:0.75:240:0.35",
    gain: 0.95,
  },
  bright: {
    freqs: [196.0, 246.94, 293.66], // G major, up an octave — lighter
    tremoloHz: 0.18,
    tremoloDepth: 0.5,
    lowpassHz: 950,
    echo: "aecho=0.8:0.6:140:0.25",
    gain: 0.82,
  },
  tense: {
    freqs: [123.47, 146.83, 185.0], // B minor-ish, closer intervals
    tremoloHz: 0.24,
    tremoloDepth: 0.55,
    lowpassHz: 720,
    echo: "aecho=0.8:0.7:160:0.3",
    gain: 0.9,
  },
};

// --- merge helpers ----------------------------------------------------------
// Precedence (low -> high): AUDIO defaults  <  brand.json  <  storyboard.sound

function clone(c: AudioConfig): AudioConfig {
  return structuredClone(c);
}

export function resolveAudioConfig(sb: any, brand: any): AudioConfig {
  const cfg = clone(AUDIO);

  // brand.json backwards-compat
  if (brand && typeof brand === "object") {
    if (typeof brand.music === "string") cfg.music.file = brand.music;
    if (typeof brand.musicVolume === "number")
      cfg.music.volume = brand.musicVolume;
  }

  // storyboard.sound overrides (partial, targeted)
  const s = sb?.sound;
  if (s && typeof s === "object") {
    const m = s.music;
    if (m && typeof m === "object") {
      if (typeof m.enabled === "boolean") cfg.music.enabled = m.enabled;
      if (m.file === null || typeof m.file === "string")
        cfg.music.file = m.file;
      if (typeof m.volume === "number") cfg.music.volume = clampVol(m.volume);
      if (typeof m.fadeInSec === "number")
        cfg.music.fadeInSec = Math.max(0, m.fadeInSec);
      if (typeof m.fadeOutSec === "number")
        cfg.music.fadeOutSec = Math.max(0, m.fadeOutSec);
      if (m.duck && typeof m.duck === "object")
        Object.assign(cfg.music.duck, m.duck);
      // a named mood swaps the whole synth recipe; an explicit synth object
      // then fine-tunes on top.
      if (typeof m.mood === "string" && MUSIC_MOODS[m.mood])
        cfg.music.synth = { ...MUSIC_MOODS[m.mood] };
      if (m.synth && typeof m.synth === "object")
        Object.assign(cfg.music.synth, m.synth);
      if (typeof m.loudnorm === "string") cfg.music.loudnorm = m.loudnorm;
    }
    const x = s.sfx;
    if (x && typeof x === "object") {
      if (typeof x.enabled === "boolean") cfg.sfx.enabled = x.enabled;
      if (typeof x.masterGain === "number")
        cfg.sfx.masterGain = clampVol(x.masterGain);
      if (typeof x.limiter === "number") cfg.sfx.limiter = clampVol(x.limiter);
      if (x.autoTransition && typeof x.autoTransition === "object")
        Object.assign(cfg.sfx.autoTransition, x.autoTransition);
      if (x.library && typeof x.library === "object")
        Object.assign(cfg.sfx.library, x.library);
    }
  }
  return cfg;
}

function clampVol(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(4, v));
}

// Stable short hash of the synth-bed-relevant settings, for caching the
// generated bed per (config, duration).
export function synthBedKey(cfg: AudioConfig, durationSec: number): string {
  const h = crypto.createHash("sha1");
  h.update(
    JSON.stringify({
      synth: cfg.music.synth,
      d: Math.round(durationSec * 100),
    }),
  );
  return h.digest("hex").slice(0, 10);
}
