import fs from "node:fs/promises";
import path from "node:path";
import { ffmpeg, probeDurationSec } from "./ffbin.js";
import {
  AudioConfig,
  resolveAudioConfig,
  synthBedKey,
} from "../audio.config.js";

const ROOT = process.cwd();
const MUSIC_EXT = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];

const MUSIC_DIR = path.join(ROOT, "input", "music");

async function accessible(p: string): Promise<string | null> {
  try {
    await fs.access(p);
    return p;
  } catch {
    return null;
  }
}

// Resolve a background-music source, mirroring how SFX cues resolve:
//   1. config.music.file as a path (has a slash or audio extension), tried both
//      relative to the project root and to input/music/, else
//   2. config.music.file as a bare NAME -> input/music/<name>.<ext>, else
//   3. the conventional default -> input/music/default.<ext>, else
//   4. the first audio file in input/music/, else
//   5. null (caller synthesizes a bed).
export async function findMusicFile(cfg: AudioConfig): Promise<string | null> {
  const f = cfg.music.file;
  if (f) {
    const ext = (f.split(".").pop() || "").toLowerCase();
    const looksLikePath = f.includes("/") || MUSIC_EXT.includes(ext);
    if (looksLikePath) {
      const hit =
        (await accessible(path.join(ROOT, f))) ??
        (await accessible(path.join(MUSIC_DIR, path.basename(f))));
      if (hit) return hit;
    } else {
      for (const e of MUSIC_EXT) {
        const hit = await accessible(path.join(MUSIC_DIR, `${f}.${e}`));
        if (hit) return hit;
      }
    }
  }
  // conventional default track
  for (const e of MUSIC_EXT) {
    const hit = await accessible(path.join(MUSIC_DIR, `default.${e}`));
    if (hit) return hit;
  }
  // otherwise the first audio file in the music dir
  try {
    const files = await fs.readdir(MUSIC_DIR);
    const first = files.find((x) =>
      MUSIC_EXT.includes((x.split(".").pop() || "").toLowerCase()),
    );
    if (first) return path.join(MUSIC_DIR, first);
  } catch {
    /* no music dir */
  }
  return null;
}

// Synthesize a soft ambient pad exactly `durationSec` long (no looping seams),
// cached per (synth settings, duration). Pure ffmpeg — zero external assets.
export async function synthesizeBed(
  cfg: AudioConfig,
  durationSec: number,
): Promise<string> {
  const dir = path.join(ROOT, "tmp", "music");
  await fs.mkdir(dir, { recursive: true });
  const out = path.join(dir, `bed-${synthBedKey(cfg, durationSec)}.wav`);
  try {
    await fs.access(out);
    return out;
  } catch {
    /* render it */
  }
  const s = cfg.music.synth;
  const d = Math.max(1, durationSec).toFixed(3);
  const inputs: string[] = [];
  const labels: string[] = [];
  s.freqs.forEach((f, i) => {
    inputs.push(
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=${f}:duration=${d}:sample_rate=44100`,
    );
    labels.push(`[${i}:a]`);
  });
  const graph =
    `${labels.join("")}amix=inputs=${s.freqs.length}:normalize=0,` +
    `tremolo=f=${s.tremoloHz}:d=${s.tremoloDepth},` +
    `lowpass=f=${s.lowpassHz},` +
    `${s.echo},` +
    `volume=${s.gain},` +
    `aformat=channel_layouts=stereo[a]`;
  await ffmpeg([
    "-y",
    ...inputs,
    "-filter_complex",
    graph,
    "-map",
    "[a]",
    "-ar",
    "44100",
    "-ac",
    "2",
    out,
  ]);
  return out;
}

// Finalize the rendered video's audio:
//   - if music is enabled: lay a soft bed UNDER the voiceover with sidechain
//     ducking (the bed dips while the VO speaks) + fades, then normalize.
//   - otherwise: just normalize loudness.
// Volumes/ducking/fades all come from the resolved audio config (defaults are
// low; storyboard.sound and brand.json can override).
export async function finalize(
  lang: string,
  opts: { videoPath?: string } = {},
) {
  const vid = opts.videoPath ?? path.join(ROOT, "out", `video.${lang}.mp4`);
  await fs.access(vid);

  let brand: any = {};
  try {
    brand = JSON.parse(
      await fs.readFile(path.join(ROOT, "input", "brand.json"), "utf8"),
    );
  } catch {
    /* no brand */
  }
  let sb: any = {};
  try {
    sb = JSON.parse(
      await fs.readFile(
        path.join(ROOT, "input", `storyboard.${lang}.json`),
        "utf8",
      ),
    );
  } catch {
    /* no storyboard */
  }

  const cfg = resolveAudioConfig(sb, brand);
  const LOUDNORM = cfg.music.loudnorm;
  const tmp = path.join(
    path.dirname(vid),
    `.finalize.${path.basename(vid, ".mp4")}.mp4`,
  );

  // Decide the music source.
  let bedFile: string | null = null;
  let loopBed = false;
  if (cfg.music.enabled && cfg.music.volume > 0) {
    const userFile = await findMusicFile(cfg);
    if (userFile) {
      bedFile = userFile;
      loopBed = true; // loop an arbitrary-length file to cover the video
    } else {
      const dur = await probeDurationSec(vid);
      bedFile = await synthesizeBed(cfg, dur);
      loopBed = false; // synthesized to exact length
    }
  }

  if (bedFile) {
    const dur = await probeDurationSec(vid);
    const fin = Math.min(cfg.music.fadeInSec, dur / 2);
    const foutStart = Math.max(0, dur - cfg.music.fadeOutSec);
    const d = cfg.music.duck;
    const filter =
      `[1:a]volume=${cfg.music.volume},` +
      `afade=t=in:d=${fin.toFixed(3)},` +
      `afade=t=out:st=${foutStart.toFixed(3)}:d=${cfg.music.fadeOutSec}[mq];` +
      `[mq][0:a]sidechaincompress=threshold=${d.threshold}:ratio=${d.ratio}:attack=${d.attack}:release=${d.release}[duck];` +
      `[0:a][duck]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix];` +
      `[mix]${LOUDNORM}[a]`;

    const args = ["-y", "-i", vid];
    if (loopBed) args.push("-stream_loop", "-1");
    args.push(
      "-i",
      bedFile,
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
      "-shortest",
      tmp,
    );
    await ffmpeg(args);
    const label = loopBed ? path.basename(bedFile) : "synth bed";
    console.log(
      `[finalize:${lang}] music (${label}) ducked under VO @ vol=${cfg.music.volume} + loudnorm`,
    );
  } else {
    await ffmpeg([
      "-y",
      "-i",
      vid,
      "-c:v",
      "copy",
      "-af",
      LOUDNORM,
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
    console.log(
      `[finalize:${lang}] loudnorm -14 LUFS (music ${cfg.music.enabled ? "on but no source" : "disabled"})`,
    );
  }

  await fs.rename(tmp, vid);
  return vid;
}

if (process.argv[1] && process.argv[1].endsWith("finalize.ts")) {
  finalize(process.argv[2] || "en").catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
