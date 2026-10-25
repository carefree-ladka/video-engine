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
    // shorter window => fewer words per page => captions stay compact and
    // comfortably inside the reserved caption band
    combineTokensWithinMilliseconds: 900,
  });

  // Fix broken words: merge tokens that don't start with space
  for (const page of pages as any[]) {
    const fixedTokens: any[] = [];
    for (let i = 0; i < page.tokens.length; i++) {
      const tok = page.tokens[i];
      const text = tok.text || "";

      // If token doesn't start with space and previous token exists, merge them
      if (
        fixedTokens.length > 0 &&
        !text.startsWith(" ") &&
        !text.match(/^[.,:;!?]$/)
      ) {
        const prev = fixedTokens[fixedTokens.length - 1];
        // Merge: extend previous token's text and endMs
        prev.text = prev.text + text;
        prev.endMs = tok.endMs || tok.toMs;
      } else {
        fixedTokens.push({ ...tok });
      }
    }
    page.tokens = fixedTokens;

    // Rebuild page text from fixed tokens
    page.text = fixedTokens
      .map((t) => t.text)
      .join("")
      .trim();
  }

  // keyword emphasis (sparse) + fix field names to match Captions.tsx
  for (const page of pages as any[]) {
    // Add endMs to page (Captions.tsx expects startMs and endMs)
    if (!page.endMs && page.durationMs) {
      page.endMs = page.startMs + page.durationMs;
    }

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

      // Convert fromMs/toMs to startMs/endMs for Captions.tsx compatibility
      if (tok.fromMs !== undefined) {
        tok.startMs = tok.fromMs;
        tok.endMs = tok.toMs;
        delete tok.fromMs;
        delete tok.toMs;
      }
    }
  }

  const outPath = path.join(ROOT, "input", `captions.${lang}.json`);
  await fs.writeFile(outPath, JSON.stringify({ pages }, null, 2));
  console.log(`[captions:${lang}] ${pages.length} pages (model=${cfg.model})`);
  return outPath;
}

// allow: tsx src/pipeline/captions.ts <lang>
// Uses the 16k mono mix produced by the voiceover step (tmp/<lang>/full16k.wav),
// so a voiceover run must have happened first.
if (process.argv[1] && process.argv[1].endsWith("captions.ts")) {
  const lang = process.argv[2] || "en";
  const full16k = path.join(ROOT, "tmp", lang, "full16k.wav");
  captions(lang, full16k).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
