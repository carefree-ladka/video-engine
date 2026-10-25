import fs from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { finalize } from "./finalize.js";
import { applySfx } from "./sfx.js";
import { assertValidStoryboard } from "./validate.js";
import { PRESETS, Platform } from "../config.js";

const ROOT = process.cwd();

// Friendly aspect names -> platform presets. One storyboard fans out to every
// aspect the responsive layout supports, so one idea ships to Shorts/Reels +
// feed + YouTube from a single source.
const FORMATS: Record<string, Platform> = {
  vertical: "short", // 1080x1920  (Shorts / Reels / TikTok / Stories)
  square: "ig-square", // 1080x1080  (IG / X feed)
  wide: "youtube", // 1920x1080  (YouTube / LinkedIn)
};

// Usage: npm run formats -- en [vertical,square,wide]
export async function formats(lang: string, which?: string[]) {
  const picked = (which && which.length ? which : Object.keys(FORMATS)).filter(
    (f) => FORMATS[f],
  );

  const base = JSON.parse(
    await fs.readFile(
      path.join(ROOT, "input", `storyboard.${lang}.json`),
      "utf8",
    ),
  );
  assertValidStoryboard(base, lang);

  let captions = { pages: [] as any[] };
  try {
    captions = JSON.parse(
      await fs.readFile(
        path.join(ROOT, "input", `captions.${lang}.json`),
        "utf8",
      ),
    );
  } catch {
    console.warn(
      `[formats:${lang}] no captions file; rendering without captions`,
    );
  }
  const brand = JSON.parse(
    await fs.readFile(path.join(ROOT, "input", "brand.json"), "utf8"),
  );

  console.log(`[formats:${lang}] bundling once...`);
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "remotion", "index.ts"),
  });

  await fs.mkdir(path.join(ROOT, "out"), { recursive: true });
  const results: string[] = [];

  for (const fmt of picked) {
    const preset = PRESETS[FORMATS[fmt]];
    // Same scenes/narration/captions, different frame. The scene templates and
    // layout read width/height and adapt (vertical vs horizontal, safe zones).
    const storyboard = {
      ...base,
      platform: FORMATS[fmt],
      width: preset.width,
      height: preset.height,
      fps: preset.fps,
    };
    const inputProps = { storyboard, captions, brand };

    const composition = await selectComposition({
      serveUrl,
      id: "MainVideo",
      inputProps,
    });

    const outPath = path.join(ROOT, "out", `video.${lang}.${fmt}.mp4`);
    console.log(
      `[formats:${lang}] ${fmt} ${composition.width}x${composition.height} -> ${path.basename(outPath)}`,
    );
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
      videoBitrate: "10M",
      encodingMaxRate: "14M",
      encodingBufferSize: "20M",
      x264Preset: "medium",
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 25 === 0)
          process.stdout.write(`  ${fmt} ${Math.round(progress * 100)}%\r`);
      },
    });
    try {
      await finalize(lang, { videoPath: outPath });
      await applySfx(lang, outPath);
    } catch (e) {
      console.warn(
        `[formats:${lang}] finalize/sfx skipped for ${fmt}: ${(e as Error).message}`,
      );
    }
    results.push(outPath);
    console.log(`\n[formats:${lang}] ${fmt} done`);
  }

  console.log(`[formats:${lang}] rendered ${results.length} format(s).`);
  return results;
}

if (process.argv[1] && process.argv[1].endsWith("formats.ts")) {
  const lang = process.argv[2] || "en";
  const which = (process.argv[3] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  formats(lang, which).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
