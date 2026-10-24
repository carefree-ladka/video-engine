import fs from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import { detectStack, pickAccentWord, titleScene } from "./text.js";

const ROOT = process.cwd();

export async function thumbnails(lang: string) {
  const sb = JSON.parse(
    await fs.readFile(path.join(ROOT, "input", `storyboard.${lang}.json`), "utf8"),
  );
  const brand = JSON.parse(
    await fs.readFile(path.join(ROOT, "input", "brand.json"), "utf8"),
  );
  const theme = sb.style?.palette ?? {
    bg: "#0E0B12",
    fg: "#F5F3F7",
    accent: "#F5A524",
  };
  const t = titleScene(sb);
  const stack = detectStack(sb);
  const heading = t.text?.heading ?? brand.channel ?? "Untitled";

  const props = {
    title: heading,
    kicker: t.text?.kicker ?? stack.topic.toUpperCase(),
    accentWord: pickAccentWord(heading),
    handle: brand.handle ?? "",
    badge: stack.label,
    theme,
  };

  console.log(`[thumb:${lang}] bundling...`);
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "remotion", "index.ts"),
  });
  await fs.mkdir(path.join(ROOT, "out"), { recursive: true });

  const targets: Array<[string, string]> = [
    ["ThumbShort", "short"],
    ["ThumbLong", "long"],
  ];
  const written: string[] = [];
  for (const [id, suffix] of targets) {
    const composition = await selectComposition({ serveUrl, id, inputProps: props });
    const output = path.join(ROOT, "out", `thumb.${lang}.${suffix}.png`);
    await renderStill({ composition, serveUrl, output, inputProps: props });
    written.push(output);
    console.log(`[thumb:${lang}] ${suffix} -> ${output}`);
  }
  return written;
}

if (process.argv[1] && process.argv[1].endsWith("thumbnail.ts")) {
  thumbnails(process.argv[2] || "en").catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
