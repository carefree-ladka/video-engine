import fs from "node:fs/promises";
import path from "node:path";
import { ffmpeg, probeDurationSec } from "./ffbin.js";

const ROOT = process.cwd();

// Re-pace a already-generated language WITHOUT re-recording the voice.
// factor > 1 slows down, < 1 speeds up. We time-stretch the narration with
// ffmpeg atempo (pitch preserved) and rescale the storyboard durations and
// caption timings by the same factor, so audio, scenes and captions stay in
// perfect sync. Pristine ".orig" copies are kept on first run so repeated
// retimes always start from the original and never compound.
export async function retime(lang: string, factor: number) {
  if (!(factor >= 0.5 && factor <= 2)) {
    throw new Error(`factor must be between 0.5 and 2 (got ${factor})`);
  }

  const sbPath = path.join(ROOT, "input", `storyboard.${lang}.json`);
  const capPath = path.join(ROOT, "input", `captions.${lang}.json`);
  const sbOrig = sbPath.replace(/\.json$/, ".orig.json");
  const capOrig = capPath.replace(/\.json$/, ".orig.json");

  await backup(sbPath, sbOrig);
  await backup(capPath, capOrig);

  const sb = JSON.parse(await fs.readFile(sbOrig, "utf8"));
  const caps = JSON.parse(await fs.readFile(capOrig, "utf8"));

  // audio: stretch from a pristine copy
  const wav = path.join(ROOT, "public", sb.audio as string);
  const wavOrig = wav.replace(/\.wav$/, ".orig.wav");
  await backup(wav, wavOrig);
  const atempo = (1 / factor).toFixed(4); // playback speed; <1 = slower
  await ffmpeg([
    "-y",
    "-i",
    wavOrig,
    "-filter:a",
    `atempo=${atempo}`,
    "-ar",
    "44100",
    "-ac",
    "2",
    wav,
  ]);
  const newDur = await probeDurationSec(wav);

  // scale storyboard scene durations + total
  for (const s of sb.scenes) {
    if (s.durationSec) s.durationSec = Number((s.durationSec * factor).toFixed(3));
  }
  sb.totalSeconds = Number(newDur.toFixed(3));
  await fs.writeFile(sbPath, JSON.stringify(sb, null, 2));

  // scale caption timings
  const scale = (ms: number) => Math.round(ms * factor);
  for (const p of caps.pages) {
    p.startMs = scale(p.startMs);
    p.endMs = scale(p.endMs);
    for (const t of p.tokens ?? []) {
      t.startMs = scale(t.startMs);
      t.endMs = scale(t.endMs);
    }
  }
  await fs.writeFile(capPath, JSON.stringify(caps, null, 2));

  const words = sb.scenes.reduce(
    (n: number, s: any) =>
      n + ((s.narration ?? "").trim() ? s.narration.trim().split(/\s+/).length : 0),
    0,
  );
  console.log(
    `[retime:${lang}] factor=${factor} atempo=${atempo} -> ${sb.totalSeconds}s, ~${Math.round(
      (words / sb.totalSeconds) * 60,
    )} WPM`,
  );
}

async function backup(src: string, dst: string) {
  try {
    await fs.access(dst);
  } catch {
    await fs.copyFile(src, dst);
  }
}

// allow: npm run pace -- en 1.15
if (process.argv[1] && process.argv[1].endsWith("retime.ts")) {
  const lang = process.argv[2] || "en";
  const factor = Number(process.argv[3] || "1.15");
  retime(lang, factor).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
