import fs from "node:fs/promises";
import path from "node:path";
import { thumbnails } from "./thumbnail.js";
import { subtitles } from "./subtitles.js";

const ROOT = process.cwd();

// Assemble everything for one language into a single, clean deliverable folder:
//   output/<lang>/video/video.mp4
//   output/<lang>/thumbnails/short.png  long.png
//   output/<lang>/socials/youtube.txt  instagram.txt  linkedin.txt
export async function publish(lang: string) {
  const base = path.join(ROOT, "output", lang);
  const dirs = {
    video: path.join(base, "video"),
    thumbnails: path.join(base, "thumbnails"),
    socials: path.join(base, "socials"),
    subtitles: path.join(base, "subtitles"),
  };
  for (const d of Object.values(dirs)) await fs.mkdir(d, { recursive: true });

  // 1) final video
  const src = path.join(ROOT, "out", `video.${lang}.mp4`);
  try {
    await fs.copyFile(src, path.join(dirs.video, "video.mp4"));
    console.log(`[publish:${lang}] video   -> output/${lang}/video/video.mp4`);
  } catch {
    console.warn(
      `[publish:${lang}] no rendered video at ${src} — run: npm run render -- ${lang}`,
    );
  }

  // 2) thumbnails rendered straight into the bundle
  await thumbnails(lang, { dir: dirs.thumbnails, prefix: "" });

  // 2b) subtitle sidecars (.srt / .vtt)
  try {
    await subtitles(lang, dirs.subtitles);
  } catch (e) {
    console.warn(
      `[publish:${lang}] subtitles skipped: ${(e as Error).message}`,
    );
  }

  // 3) socials from authored metadata — source of truth is input/metadata.<lang>.json
  //    (committed, durable); fall back to out/ for older runs.
  let meta: any = null;
  for (const metaPath of [
    path.join(ROOT, "input", `metadata.${lang}.json`),
    path.join(ROOT, "out", `metadata.${lang}.json`),
  ]) {
    try {
      meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
      break;
    } catch {
      /* try next */
    }
  }
  if (!meta) {
    await fs.writeFile(
      path.join(dirs.socials, "README.txt"),
      "No metadata found for this video.\n\nAsk the video-producer agent to author reach-optimized\nmetadata (video-metadata skill). It writes input/metadata." +
        lang +
        ".json, then `npm run publish -- " +
        lang +
        "` drops youtube.txt / instagram.txt / linkedin.txt here.\n",
    );
    console.warn(
      `[publish:${lang}] no out/metadata.${lang}.json yet — wrote socials/README.txt`,
    );
  } else {
    await writeSocials(dirs.socials, meta);
    console.log(`[publish:${lang}] socials -> output/${lang}/socials/*.txt`);
  }

  console.log(`[publish:${lang}] bundle ready -> output/${lang}/`);
  return base;
}

async function writeSocials(dir: string, m: any) {
  const yt = m.youtube ?? {};
  const sh = m.youtubeShorts ?? {};
  const ig = m.instagram ?? {};
  const li = m.linkedin ?? {};

  const section = (title: string) => `=== ${title} ===\n`;
  const block = (label: string, body: string) =>
    `${label}\n${"-".repeat(label.length)}\n${body}\n`;

  const youtubeTxt = [
    section("YOUTUBE — LONG-FORM"),
    block("TITLE", yt.title ?? ""),
    block("DESCRIPTION", yt.description ?? ""),
    block("TAGS", (yt.tags ?? []).join(", ")),
    "",
    section("YOUTUBE — SHORTS"),
    block("TITLE", sh.title ?? ""),
    block("DESCRIPTION", sh.description ?? ""),
  ].join("\n");
  await fs.writeFile(path.join(dir, "youtube.txt"), youtubeTxt);

  const instagramTxt = [
    section("INSTAGRAM — REEL"),
    block("CAPTION", ig.caption ?? ""),
    block("HASHTAGS", (ig.hashtags ?? []).join(" ")),
  ].join("\n");
  await fs.writeFile(path.join(dir, "instagram.txt"), instagramTxt);

  const linkedinTxt = [
    section("LINKEDIN"),
    block("POST", li.post ?? ""),
    block("HASHTAGS", (li.hashtags ?? []).join(" ")),
  ].join("\n");
  await fs.writeFile(path.join(dir, "linkedin.txt"), linkedinTxt);
}

if (process.argv[1] && process.argv[1].endsWith("publish.ts")) {
  publish(process.argv[2] || "en").catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
