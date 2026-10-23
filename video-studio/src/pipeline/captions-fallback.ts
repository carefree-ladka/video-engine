import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const STOP_EN = new Set([
  "the","a","an","and","or","but","to","of","in","on","for","is","are","it","that","this","with","as","at","be","was","i","you","me","my","so","can",
]);

function isEmphasis(word: string, lang: string): boolean {
  const w = word.toLowerCase().replace(/[^a-z0-9%$\u0900-\u097F]/gi, "");
  if (!w) return false;
  if (/[0-9%$]/.test(w)) return true;
  if (lang.startsWith("en")) return !STOP_EN.has(w) && w.length >= 5;
  return w.length >= 3; // Hindi / other: emphasize content words
}

/**
 * Synthetic word alignment: distribute each scene's narration words evenly across
 * that scene's measured audio window, then group into TikTok-style pages.
 * Not as accurate as Whisper, but validates caption rendering end-to-end
 * (text, Devanagari script, paging, karaoke highlight, keyword emphasis).
 */
export async function syntheticCaptions(lang: string) {
  const sbPath = path.join(ROOT, "input", `storyboard.${lang}.json`);
  const sb = JSON.parse(await fs.readFile(sbPath, "utf8"));

  const pages: any[] = [];
  let offsetMs = 0;
  const MAX_WORDS = 4;
  const MAX_PAGE_MS = 2200;

  for (const scene of sb.scenes) {
    const durMs = Math.round((scene.durationSec || 2) * 1000);
    const text: string = (scene.narration ?? "").trim();
    if (!text) {
      offsetMs += durMs;
      continue;
    }
    const words = text.split(/\s+/);
    // weight each word by length so longer words get a touch more time
    const weights = words.map((w) => Math.max(2, w.replace(/[^\p{L}\p{N}]/gu, "").length));
    const totalW = weights.reduce((a, b) => a + b, 0) || 1;

    let t = offsetMs;
    const timed = words.map((w, i) => {
      const slice = (weights[i] / totalW) * durMs;
      const tok = { text: w, startMs: Math.round(t), endMs: Math.round(t + slice), emphasis: isEmphasis(w, lang) };
      t += slice;
      return tok;
    });

    // group into pages
    let i = 0;
    while (i < timed.length) {
      const group = [] as any[];
      const pageStart = timed[i].startMs;
      while (
        i < timed.length &&
        group.length < MAX_WORDS &&
        timed[i].endMs - pageStart <= MAX_PAGE_MS
      ) {
        group.push(timed[i]);
        i++;
      }
      pages.push({ startMs: group[0].startMs, endMs: group[group.length - 1].endMs, tokens: group });
    }

    offsetMs += durMs;
  }

  const outPath = path.join(ROOT, "input", `captions.${lang}.json`);
  await fs.writeFile(outPath, JSON.stringify({ pages, _source: "synthetic" }, null, 2));
  console.log(`[captions:${lang}] synthetic alignment -> ${pages.length} pages`);
  return outPath;
}

if (process.argv[1] && process.argv[1].endsWith("captions-fallback.ts")) {
  syntheticCaptions(process.argv[2] || "en").catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
