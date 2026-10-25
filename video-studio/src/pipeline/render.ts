import fs from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { finalize } from "./finalize.js";
import { applySfx } from "./sfx.js";
import { assertValidStoryboard } from "./validate.js";

const ROOT = process.cwd();

export async function render(lang: string) {
  const storyboard = JSON.parse(
    await fs.readFile(
      path.join(ROOT, "input", `storyboard.${lang}.json`),
      "utf8",
    ),
  );
  assertValidStoryboard(storyboard, lang);
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
      `[render:${lang}] no captions file, rendering without captions`,
    );
  }
  const brand = JSON.parse(
    await fs.readFile(path.join(ROOT, "input", "brand.json"), "utf8"),
  );

  const inputProps = { storyboard, captions, brand };

  console.log(`[render:${lang}] bundling...`);
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "remotion", "index.ts"),
  });

  const composition = await selectComposition({
    serveUrl,
    id: "MainVideo",
    inputProps,
  });

  await fs.mkdir(path.join(ROOT, "out"), { recursive: true });
  const outputLocation = path.join(ROOT, "out", `video.${lang}.mp4`);

  console.log(
    `[render:${lang}] rendering ${composition.durationInFrames} frames @ ${composition.width}x${composition.height}...`,
  );
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
    // Quality: Remotion's default CRF produced ~0.5 Mbps on our flat dark
    // backgrounds, which bands the gradients. Force a high target bitrate
    // (~10 Mbps) with headroom so gradients stay clean. finalize.ts copies the
    // video stream (-c:v copy), so this is the bitrate of the delivered file.
    videoBitrate: "10M",
    encodingMaxRate: "14M",
    encodingBufferSize: "20M",
    x264Preset: "slow",
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 20 === 0)
        process.stdout.write(`  ${Math.round(progress * 100)}%\r`);
    },
  });

  console.log(`\n[render:${lang}] done -> ${outputLocation}`);

  // normalize loudness (+ mix a ducked music bed if one is present)
  try {
    await finalize(lang);
  } catch (e) {
    console.warn(`[render:${lang}] finalize skipped: ${(e as Error).message}`);
  }

  // mix scene-timed sound effects (no-op if the storyboard has no cues)
  try {
    await applySfx(lang, outputLocation);
  } catch (e) {
    console.warn(`[render:${lang}] sfx skipped: ${(e as Error).message}`);
  }

  return outputLocation;
}

// allow: npm run render -- hi
if (process.argv[1] && process.argv[1].endsWith("render.ts")) {
  const lang = process.argv[2] || "en";
  render(lang).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
