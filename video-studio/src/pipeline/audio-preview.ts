import fs from "node:fs/promises";
import path from "node:path";
import { ffmpeg } from "./ffbin.js";
import { resolveAudioConfig } from "../audio.config.js";
import { findMusicFile, synthesizeBed } from "./finalize.js";
import { computeCues, resolveSfx } from "./sfx.js";

const ROOT = process.cwd();

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// Render a short AUDIO-ONLY preview of the resolved sound design: the music bed
// ducked under the (existing) narration + the SFX cues that fall inside the
// window, mixed exactly the way the real pipeline does (finalize's loudnorm,
// then sfx's limiter). Fast — no video render. Output: out/audio-preview.<lang>.wav
export async function previewAudio(lang: string, seconds = 12): Promise<string> {
  const secs = Math.max(2, Math.min(30, seconds || 12));
  let sb: any = {};
  try {
    sb = JSON.parse(
      await fs.readFile(path.join(ROOT, "input", `storyboard.${lang}.json`), "utf8"),
    );
  } catch {
    throw new Error(`no storyboard for "${lang}" (input/storyboard.${lang}.json)`);
  }
  let brand: any = {};
  try {
    brand = JSON.parse(await fs.readFile(path.join(ROOT, "input", "brand.json"), "utf8"));
  } catch {
    /* no brand */
  }
  const cfg = resolveAudioConfig(sb, brand);

  const inputs: string[] = [];
  let idx = 0;

  // input 0: narration slice if present, else silence
  const narration = path.join(ROOT, "public", "narration", lang, "full.wav");
  const hasVoice = await exists(narration);
  if (hasVoice) inputs.push("-i", narration);
  else inputs.push("-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo");
  idx = 1;

  // music bed input
  let bedIdx = -1;
  let loopBed = false;
  if (cfg.music.enabled && cfg.music.volume > 0) {
    const userFile = await findMusicFile(cfg);
    if (userFile) {
      inputs.push("-stream_loop", "-1", "-i", userFile);
      loopBed = true;
    } else {
      const bed = await synthesizeBed(cfg, secs);
      inputs.push("-i", bed);
    }
    bedIdx = idx++;
  }
  void loopBed;

  // sfx cue inputs (only those inside the window)
  const cues = computeCues(sb, cfg).filter((c) => c.tSec < secs);
  const sfxInputs: { idx: number; ms: number; vol: number }[] = [];
  for (const c of cues) {
    const { file, baseGain } = await resolveSfx(c.name, cfg.sfx.library);
    inputs.push("-i", file);
    sfxInputs.push({
      idx: idx++,
      ms: Math.round(c.tSec * 1000),
      vol: cfg.sfx.masterGain * c.gain * baseGain,
    });
  }

  // ---- build the filtergraph ----
  const parts: string[] = [];
  let baseLabel = "[0:a]";

  if (bedIdx >= 0) {
    const fin = Math.min(cfg.music.fadeInSec, secs / 2);
    const foutStart = Math.max(0, secs - cfg.music.fadeOutSec);
    const d = cfg.music.duck;
    parts.push(
      `[${bedIdx}:a]volume=${cfg.music.volume},afade=t=in:d=${fin.toFixed(3)},afade=t=out:st=${foutStart.toFixed(3)}:d=${cfg.music.fadeOutSec}[mq]`,
    );
    parts.push(
      `[mq][0:a]sidechaincompress=threshold=${d.threshold}:ratio=${d.ratio}:attack=${d.attack}:release=${d.release}[duck]`,
    );
    parts.push(`[0:a][duck]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mixm]`);
    parts.push(`[mixm]${cfg.music.loudnorm}[base]`);
    baseLabel = "[base]";
  } else if (hasVoice) {
    parts.push(`[0:a]${cfg.music.loudnorm}[base]`);
    baseLabel = "[base]";
  }

  const sfxLabels: string[] = [];
  sfxInputs.forEach((s, k) => {
    parts.push(`[${s.idx}:a]adelay=${s.ms}|${s.ms},volume=${s.vol.toFixed(4)}[s${k}]`);
    sfxLabels.push(`[s${k}]`);
  });

  if (sfxLabels.length) {
    parts.push(
      `${baseLabel}${sfxLabels.join("")}amix=inputs=${1 + sfxLabels.length}:normalize=0:dropout_transition=0[mx]`,
    );
    parts.push(`[mx]alimiter=limit=${cfg.sfx.limiter}[a]`);
  } else {
    parts.push(`${baseLabel}alimiter=limit=${cfg.sfx.limiter}[a]`);
  }

  const out = path.join(ROOT, "out", `audio-preview.${lang}.wav`);
  await fs.mkdir(path.join(ROOT, "out"), { recursive: true });
  await ffmpeg([
    "-y",
    ...inputs,
    "-filter_complex",
    parts.join(";"),
    "-map",
    "[a]",
    "-t",
    String(secs),
    "-ar",
    "44100",
    "-ac",
    "2",
    out,
  ]);

  console.log(
    `[preview:${lang}] ${secs}s audio preview -> ${path.relative(ROOT, out)} ` +
      `(music ${bedIdx >= 0 ? "on" : "off"}, ${sfxInputs.length} sfx, voice ${hasVoice ? "yes" : "no"})`,
  );
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("audio-preview.ts")) {
  const lang = process.argv[2] || "en";
  const secs = Number(process.argv[3]) || 12;
  previewAudio(lang, secs).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
