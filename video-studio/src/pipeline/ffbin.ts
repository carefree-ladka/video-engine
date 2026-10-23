import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

export const FFMPEG = (ffmpegStatic as unknown as string) || "ffmpeg";
export const FFPROBE = ffprobeStatic.path || "ffprobe";

export async function ffmpeg(args: string[]) {
  return execFileP(FFMPEG, args, { maxBuffer: 1024 * 1024 * 64 });
}

export async function probeDurationSec(file: string): Promise<number> {
  const { stdout } = await execFileP(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=nk=1:noprint_wrappers=1",
    file,
  ]);
  return parseFloat(stdout.trim());
}
