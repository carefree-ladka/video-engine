import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { FFMPEG, FFPROBE, probeDurationSec } from "./ffbin.js";

const execFileP = promisify(execFile);
const ROOT = process.cwd();

// Run a read-only ffmpeg analysis filter and return its stderr (where ffmpeg
// prints filter stats).
async function analyze(args: string[]): Promise<string> {
  try {
    const { stderr } = await execFileP(FFMPEG, args, {
      maxBuffer: 1024 * 1024 * 64,
    });
    return stderr || "";
  } catch (e: any) {
    // ffmpeg exits non-zero on `-f null` sometimes; stderr still holds the data
    return (e?.stderr as string) || "";
  }
}

export type QaReport = {
  file: string;
  durationSec: number;
  integratedLUFS: number | null;
  loudnessOk: boolean | null;
  blackSegments: Array<{ start: number; end: number }>;
  contactSheet: string | null;
  warnings: string[];
};

// Post-render QA: integrated loudness (target ~-14 LUFS), black-frame
// detection, and a contact sheet of sampled frames for a quick eyeball.
export async function qa(lang: string, videoPath?: string): Promise<QaReport> {
  const vid = videoPath ?? path.join(ROOT, "out", `video.${lang}.mp4`);
  await fs.access(vid);
  const durationSec = await probeDurationSec(vid);
  const warnings: string[] = [];

  // --- loudness (EBU R128 integrated) ---
  const ebu = await analyze(["-hide_banner", "-i", vid, "-af", "ebur128", "-f", "null", "-"]);
  const lufsMatches = [...ebu.matchAll(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/g)];
  const integratedLUFS = lufsMatches.length
    ? parseFloat(lufsMatches[lufsMatches.length - 1][1])
    : null;
  let loudnessOk: boolean | null = null;
  if (integratedLUFS != null) {
    loudnessOk = integratedLUFS >= -16 && integratedLUFS <= -12;
    if (!loudnessOk)
      warnings.push(
        `integrated loudness ${integratedLUFS} LUFS is outside the -14±2 target.`,
      );
  } else {
    warnings.push("could not measure loudness (no audio stream?).");
  }

  // --- black frames ---
  const bd = await analyze([
    "-hide_banner",
    "-i",
    vid,
    "-vf",
    "blackdetect=d=0.15:pic_th=0.98",
    "-an",
    "-f",
    "null",
    "-",
  ]);
  const blackSegments = [...bd.matchAll(/black_start:(\d+(?:\.\d+)?)\s+black_end:(\d+(?:\.\d+)?)/g)].map(
    (m) => ({ start: parseFloat(m[1]), end: parseFloat(m[2]) }),
  );
  // ignore a tiny tail/head flicker; warn on mid-video black
  for (const seg of blackSegments) {
    if (seg.end - seg.start >= 0.25 && seg.start > 0.2 && seg.end < durationSec - 0.2)
      warnings.push(`black frames ${seg.start.toFixed(2)}-${seg.end.toFixed(2)}s.`);
  }

  // --- contact sheet (3x3 sampled frames) ---
  let contactSheet: string | null = null;
  try {
    const out = path.join(ROOT, "out", `qa.${lang}.contact.png`);
    const n = 9;
    const rate = (n / Math.max(1, durationSec)).toFixed(4);
    await execFileP(FFMPEG, [
      "-y",
      "-hide_banner",
      "-i",
      vid,
      "-vf",
      `fps=${rate},scale=360:-1,tile=3x3:margin=8:padding=8`,
      "-frames:v",
      "1",
      out,
    ]);
    contactSheet = path.relative(ROOT, out);
  } catch {
    warnings.push("contact sheet generation failed.");
  }

  const report: QaReport = {
    file: path.relative(ROOT, vid),
    durationSec: Number(durationSec.toFixed(3)),
    integratedLUFS,
    loudnessOk,
    blackSegments,
    contactSheet,
    warnings,
  };
  console.log(`[qa:${lang}] ${JSON.stringify(report, null, 2)}`);
  return report;
}

void FFPROBE;

if (process.argv[1] && process.argv[1].endsWith("qa.ts")) {
  qa(process.argv[2] || "en").catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
