import fs from "node:fs/promises";
import path from "node:path";
import { ffmpeg } from "./ffbin.js";

const ROOT = process.cwd();
const MUSIC_EXT = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];

// Find a music bed: brand.music path, else the first file in input/music/.
async function findMusic(brand: any): Promise<string | null> {
  if (brand?.music) {
    const p = path.join(ROOT, brand.music);
    try {
      await fs.access(p);
      return p;
    } catch {
      /* fallthrough */
    }
  }
  const dir = path.join(ROOT, "input", "music");
  try {
    const files = await fs.readdir(dir);
    const hit = files.find((f) =>
      MUSIC_EXT.includes((f.split(".").pop() || "").toLowerCase()),
    );
    if (hit) return path.join(dir, hit);
  } catch {
    /* no music dir */
  }
  return null;
}

// Finalize the rendered video's audio:
//  - if a music bed exists: mix it UNDER the voiceover with sidechain ducking
//    (music dips while the VO speaks), then normalize loudness
//  - otherwise: just normalize loudness
// Targets ~-14 LUFS / -1.5 dBTP (YouTube-friendly; fine for Reels/Shorts too).
export async function finalize(
  lang: string,
  opts: { musicVolume?: number } = {},
) {
  const vid = path.join(ROOT, "out", `video.${lang}.mp4`);
  await fs.access(vid);

  let brand: any = {};
  try {
    brand = JSON.parse(
      await fs.readFile(path.join(ROOT, "input", "brand.json"), "utf8"),
    );
  } catch {
    /* no brand */
  }

  const music = await findMusic(brand);
  const vol = opts.musicVolume ?? brand.musicVolume ?? 0.12;
  const tmp = path.join(ROOT, "out", `.finalize.${lang}.mp4`);
  const LOUDNORM = "loudnorm=I=-14:TP=-1.5:LRA=11";

  if (music) {
    await ffmpeg([
      "-y",
      "-i",
      vid,
      "-stream_loop",
      "-1",
      "-i",
      music,
      "-filter_complex",
      `[1:a]volume=${vol}[mq];` +
        `[mq][0:a]sidechaincompress=threshold=0.04:ratio=8:attack=20:release=300[duck];` +
        `[0:a][duck]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix];` +
        `[mix]${LOUDNORM}[a]`,
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
      "-shortest",
      tmp,
    ]);
    console.log(
      `[finalize:${lang}] music bed + ducking + loudnorm (${path.basename(music)} @ ${vol})`,
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
      tmp,
    ]);
    console.log(`[finalize:${lang}] loudnorm -14 LUFS (no music bed found)`);
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
