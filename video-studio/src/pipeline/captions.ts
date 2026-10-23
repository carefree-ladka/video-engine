import fs from "node:fs/promises";
import path from "node:path";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { WHISPER_BY_LANG } from "../config.js";

const ROOT = process.cwd();
const WHISPER_DIR = path.join(ROOT, "whisper.cpp");
const WHISPER_VERSION = "1.5.5"; // make-based build (no cmake needed)

const STOP_EN = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "are",
  "it",
  "that",
  "this",
  "with",
  "as",
  "at",
  "be",
  "was",
  "i",
  "you",
  "me",
  "my",
]);

export async function captions(lang: string, full16k: string) {
  const cfg = WHISPER_BY_LANG[lang] ?? { model: "base.en", language: "en" };

  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
  await downloadWhisperModel({ folder: WHISPER_DIR, model: cfg.model as any });

  const whisperCppOutput = await transcribe({
    inputPath: full16k,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    model: cfg.model as any,
    language: cfg.language as any,
    tokenLevelTimestamps: true,
  });

  const { captions: words } = toCaptions({ whisperCppOutput });
  const { pages } = createTikTokStyleCaptions({
    captions: words as any,
    combineTokensWithinMilliseconds: 1200,
  });

  // keyword emphasis (sparse)
  for (const page of pages as any[]) {
    for (const tok of page.tokens) {
      const w = String(tok.text)
        .toLowerCase()
        .replace(/[^a-z0-9%$]/gi, "");
      const isNum = /[0-9%$]/.test(w);
      tok.emphasis =
        w.length > 0 &&
        (isNum ||
          (lang.startsWith("en")
            ? !STOP_EN.has(w) && w.length >= 5
            : w.length >= 3));
    }
  }

  const outPath = path.join(ROOT, "input", `captions.${lang}.json`);
  await fs.writeFile(outPath, JSON.stringify({ pages }, null, 2));
  console.log(`[captions:${lang}] ${pages.length} pages (model=${cfg.model})`);
  return outPath;
}
