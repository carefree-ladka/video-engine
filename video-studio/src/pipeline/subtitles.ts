import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

function stamp(ms: number, sep: "," | "."): string {
  const t = Math.max(0, Math.round(ms));
  const h = Math.floor(t / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  const milli = t % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)}${sep}${p(milli, 3)}`;
}

function pageText(p: any): string {
  return (p.tokens ?? [])
    .map((t: any) => t.text)
    .join(" ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// Export .srt + .vtt subtitle sidecars from captions.<lang>.json (one cue per page).
export async function subtitles(lang: string, dir: string) {
  const caps = JSON.parse(
    await fs.readFile(path.join(ROOT, "input", `captions.${lang}.json`), "utf8"),
  );
  const pages = caps.pages ?? [];
  await fs.mkdir(dir, { recursive: true });

  const srt = pages
    .map(
      (p: any, i: number) =>
        `${i + 1}\n${stamp(p.startMs, ",")} --> ${stamp(p.endMs, ",")}\n${pageText(p)}\n`,
    )
    .join("\n");
  const srtPath = path.join(dir, "captions.srt");
  await fs.writeFile(srtPath, srt);

  const vtt =
    "WEBVTT\n\n" +
    pages
      .map(
        (p: any) =>
          `${stamp(p.startMs, ".")} --> ${stamp(p.endMs, ".")}\n${pageText(p)}\n`,
      )
      .join("\n");
  const vttPath = path.join(dir, "captions.vtt");
  await fs.writeFile(vttPath, vtt);

  console.log(`[subtitles:${lang}] ${pages.length} cues -> ${dir}`);
  return [srtPath, vttPath];
}

if (process.argv[1] && process.argv[1].endsWith("subtitles.ts")) {
  const lang = process.argv[2] || "en";
  subtitles(lang, path.join(ROOT, "out")).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
