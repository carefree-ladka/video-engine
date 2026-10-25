import fs from "node:fs/promises";
import path from "node:path";
import { ffmpeg } from "./ffbin.js";
import { AudioConfig, SfxRecipe, resolveAudioConfig } from "../audio.config.js";

const ROOT = process.cwd();
const CACHE = path.join(ROOT, "tmp", "sfx");
const USER_DIR = path.join(ROOT, "input", "sfx");
const AUDIO_EXT = ["wav", "mp3", "m4a", "aac", "ogg", "flac"];

export type Cue = { name: string; tSec: number; gain: number };

async function findUserSfx(name: string): Promise<string | null> {
  for (const ext of AUDIO_EXT) {
    const p = path.join(USER_DIR, `${name}.${ext}`);
    try {
      await fs.access(p);
      return p;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

// Return a playable file + its intrinsic base gain for a cue name:
//   - a user override at input/sfx/<name>.<ext> (base gain 1), else
//   - a synthesized, cached wav rendered at UNIT level (gain is applied only
//     later at mix time, so there is no double attenuation).
// Unknown names fall back to "pop".
export async function resolveSfx(
  name: string,
  library: Record<string, SfxRecipe>,
): Promise<{ file: string; baseGain: number }> {
  const user = await findUserSfx(name);
  if (user) return { file: user, baseGain: 1 };

  const key = name in library ? name : "pop";
  const recipe = library[key] ?? library.pop;
  await fs.mkdir(CACHE, { recursive: true });
  const out = path.join(CACHE, `${key}.wav`);
  try {
    await fs.access(out);
  } catch {
    await ffmpeg([
      "-y",
      "-f",
      "lavfi",
      "-i",
      recipe.lavfi,
      "-af",
      `${recipe.af},aformat=channel_layouts=stereo`,
      "-ar",
      "44100",
      "-ac",
      "2",
      out,
    ]);
  }
  return { file: out, baseGain: recipe.gain };
}

// Collect every cue on the timeline. Two sources, both storyboard-driven:
//   1. Auto scene-transition cue at each scene boundary (config.sfx.autoTransition).
//      A scene can override with `transition: "swoosh"` / `{cue,gain,offset}`
//      or disable with `transition: false`.
//   2. Per-scene accent cues via `sfx`: a string, an object {cue,gain,offset},
//      or an array of those (e.g. a "pop" when an element appears mid-scene).
export function computeCues(sb: any, cfg: AudioConfig): Cue[] {
  if (!cfg.sfx.enabled) return [];
  const cues: Cue[] = [];
  const at = cfg.sfx.autoTransition;
  let t = 0;

  (sb.scenes ?? []).forEach((s: any, i: number) => {
    // 1) transition cue (audio). `transitionSfx` overrides the auto cue;
    // `transitionSfx: false` mutes the whoosh for this scene. (The separate
    // `transition` key selects the VISUAL transition family in Video.tsx.)
    if (at.enabled && !(i === 0 && at.skipFirst) && s.transitionSfx !== false) {
      const ov = s.transitionSfx;
      const name =
        typeof ov === "string" ? ov : (ov?.cue ?? ov?.name ?? at.cue);
      const gainMul =
        typeof ov === "object" && ov ? (ov.gain ?? at.gain) : at.gain;
      const offset =
        (typeof ov === "object" && ov ? (ov.offset ?? 0) : 0) + at.offset;
      cues.push({ name, tSec: Math.max(0, t + offset), gain: gainMul });
    }

    // 2) accent cue(s)
    const raw = s.sfx;
    if (raw) {
      const list = Array.isArray(raw) ? raw : [raw];
      for (const entry of list) {
        if (entry === false) continue;
        const name =
          typeof entry === "string"
            ? entry
            : (entry?.cue ?? entry?.name ?? "pop");
        const offset =
          typeof entry === "object" && entry ? (entry.offset ?? 0) : 0;
        const gain = typeof entry === "object" && entry ? (entry.gain ?? 1) : 1;
        cues.push({ name, tSec: Math.max(0, t + offset), gain });
      }
    }

    t += s.durationSec || 2;
  });

  return cues.sort((a, b) => a.tSec - b.tSec);
}

// Mix scene-timed SFX into a rendered video's audio. No-op if disabled or if the
// storyboard has no cues. Runs after finalize, with a limiter so summed sfx +
// voice (+music) never clip. Each cue's final volume = masterGain * cueGain *
// recipeBaseGain.
export async function applySfx(lang: string, videoPath?: string) {
  const vid = videoPath ?? path.join(ROOT, "out", `video.${lang}.mp4`);
  let sb: any;
  try {
    sb = JSON.parse(
      await fs.readFile(
        path.join(ROOT, "input", `storyboard.${lang}.json`),
        "utf8",
      ),
    );
  } catch {
    return; // no storyboard, nothing to do
  }
  let brand: any = {};
  try {
    brand = JSON.parse(
      await fs.readFile(path.join(ROOT, "input", "brand.json"), "utf8"),
    );
  } catch {
    /* no brand */
  }

  const cfg = resolveAudioConfig(sb, brand);
  const cues = computeCues(sb, cfg);
  if (!cues.length) {
    console.log(
      `[sfx:${lang}] no cues (sfx ${cfg.sfx.enabled ? "on" : "off"})`,
    );
    return;
  }

  const inputs: string[] = ["-i", vid];
  const parts: string[] = [];
  const mixLabels: string[] = ["[0:a]"];
  let idx = 1;
  for (let k = 0; k < cues.length; k++) {
    const { file, baseGain } = await resolveSfx(cues[k].name, cfg.sfx.library);
    const vol = cfg.sfx.masterGain * cues[k].gain * baseGain;
    const ms = Math.round(cues[k].tSec * 1000);
    inputs.push("-i", file);
    parts.push(`[${idx}:a]adelay=${ms}|${ms},volume=${vol.toFixed(4)}[s${k}]`);
    mixLabels.push(`[s${k}]`);
    idx++;
  }
  const filter =
    parts.join(";") +
    `;${mixLabels.join("")}amix=inputs=${mixLabels.length}:normalize=0:dropout_transition=0[mx];` +
    `[mx]alimiter=limit=${cfg.sfx.limiter}[a]`;

  const tmp = path.join(
    path.dirname(vid),
    `.sfx.${path.basename(vid, ".mp4")}.mp4`,
  );
  await ffmpeg([
    "-y",
    ...inputs,
    "-filter_complex",
    filter,
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-ac",
    "2",
    tmp,
  ]);
  await fs.rename(tmp, vid);
  console.log(
    `[sfx:${lang}] mixed ${cues.length} cue(s) @ masterGain=${cfg.sfx.masterGain} into ${path.basename(vid)}`,
  );
}

if (process.argv[1] && process.argv[1].endsWith("sfx.ts")) {
  const lang = process.argv[2] || "en";
  applySfx(lang).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
