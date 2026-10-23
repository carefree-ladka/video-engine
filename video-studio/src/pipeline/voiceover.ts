import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MsEdgeTTS, OUTPUT_FORMAT, ProsodyOptions } from "msedge-tts";
import { ffmpeg, probeDurationSec } from "./ffbin.js";
import { VOICE_BY_LANG, ELEVENLABS_MODEL, F5 } from "../config.js";
import { normalizeForTTS } from "./normalize.js";

const execFileP = promisify(execFile);
const ROOT = process.cwd();

// ---- .env loader (root + project), skips comments, doesn't override real env ----
let dotEnvLoaded = false;
async function loadDotEnv() {
  if (dotEnvLoaded) return;
  dotEnvLoaded = true;
  for (const p of [path.join(ROOT, "..", ".env"), path.join(ROOT, ".env")]) {
    try {
      const txt = await fs.readFile(p, "utf8");
      for (const raw of txt.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith("#")) continue;
        const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
        if (m && !(m[1] in process.env))
          process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "").trim();
      }
    } catch {
      /* no file here */
    }
  }
}

// ---- providers ----
async function sayToWav(
  voice: string,
  text: string,
  aiff: string,
  wav: string,
) {
  await execFileP("say", ["-v", voice, "-o", aiff, text]);
  await ffmpeg(["-y", "-i", aiff, "-ar", "44100", "-ac", "2", wav]);
}

async function elevenToWav(
  key: string,
  voiceId: string,
  text: string,
  mp3: string,
  wav: string,
) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok)
    throw new Error(
      `ElevenLabs ${res.status} ${(await res.text().catch(() => "")).slice(0, 160)}`,
    );
  await fs.writeFile(mp3, Buffer.from(await res.arrayBuffer()));
  await ffmpeg(["-y", "-i", mp3, "-ar", "44100", "-ac", "2", wav]);
}

function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("close", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    setTimeout(() => reject(new Error("Edge TTS timeout")), 60000);
  });
}

function edgeProsody(): ProsodyOptions {
  const p = new ProsodyOptions();
  if (process.env.TTS_VOICE_RATE) (p as any).rate = process.env.TTS_VOICE_RATE;
  if (process.env.TTS_VOICE_PITCH)
    (p as any).pitch = process.env.TTS_VOICE_PITCH;
  if (process.env.TTS_VOICE_VOLUME)
    (p as any).volume = process.env.TTS_VOICE_VOLUME;
  return p;
}

async function makeEdge(voice: string): Promise<MsEdgeTTS> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  return tts;
}

async function edgeToWav(
  tts: MsEdgeTTS,
  prosody: ProsodyOptions,
  text: string,
  mp3: string,
  wav: string,
) {
  const { audioStream } = tts.toStream(text, prosody);
  const buf = await streamToBuffer(audioStream);
  if (!buf.length) throw new Error("Edge TTS returned no audio");
  await fs.writeFile(mp3, buf);
  await ffmpeg(["-y", "-i", mp3, "-ar", "44100", "-ac", "2", wav]);
}

// ---- F5 (cloned voice) batch ----
async function runF5Batch(
  lang: string,
  sb: any,
): Promise<Record<string, string>> {
  const refAudio = path.join(ROOT, F5.refAudio);
  const refTextFile = path.join(ROOT, F5.refTextFile);
  try {
    await fs.access(refAudio);
  } catch {
    throw new Error(
      `cloned-voice reference missing: ${F5.refAudio}. Add your recording (see input/voice/README.md).`,
    );
  }
  let refText = "";
  try {
    refText = (await fs.readFile(refTextFile, "utf8")).trim();
  } catch {
    throw new Error(`reference transcript missing: ${F5.refTextFile}.`);
  }
  if (!refText)
    throw new Error(`reference transcript ${F5.refTextFile} is empty.`);

  const outDir = path.join(ROOT, "tmp", lang, "f5");
  await fs.mkdir(outDir, { recursive: true });
  const manifest = {
    ref_audio: refAudio,
    ref_text: refText,
    out_dir: outDir,
    speed: F5.speed,
    nfe: F5.nfe,
    scenes: sb.scenes
      .filter((s: any) => (s.narration ?? "").trim())
      .map((s: any) => ({ id: s.id, text: normalizeForTTS(s.narration) })),
  };
  const manifestPath = path.join(outDir, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(
    `[voiceover:${lang}] F5-TTS cloning your voice (${manifest.scenes.length} scenes)...`,
  );
  try {
    const { stdout } = await execFileP(
      F5.python,
      [path.join(ROOT, F5.script), "--manifest", manifestPath],
      {
        maxBuffer: 1024 * 1024 * 64,
      },
    );
    if (!/\[f5\] DONE/.test(stdout))
      throw new Error("F5 did not report completion.");
  } catch (e: any) {
    throw new Error(
      `F5-TTS failed — your cloned voice was NOT used.\n${(e.stderr || e.message || "").toString().trim()}`,
    );
  }

  const map: Record<string, string> = {};
  for (const s of manifest.scenes) map[s.id] = path.join(outDir, `${s.id}.wav`);
  return map;
}

export async function voiceover(lang: string) {
  await loadDotEnv();
  const sbPath = path.join(ROOT, "input", `storyboard.${lang}.json`);
  const sb = JSON.parse(await fs.readFile(sbPath, "utf8"));
  const map = VOICE_BY_LANG[lang] ?? VOICE_BY_LANG.en;

  const argv = process.argv;
  const key =
    process.env.ELEVEN_LABS_KEY || process.env.ELEVENLABS_API_KEY || null;
  const edgeVoice = process.env.TTS_VOICE || null;
  const allowFallback = argv.includes("--allow-fallback");

  let provider: "eleven" | "say" | "f5" | "edge";
  if (argv.includes("--f5")) provider = "f5";
  else if (argv.includes("--edge")) provider = "edge";
  else if (argv.includes("--say")) provider = "say";
  else if (argv.includes("--eleven")) provider = "eleven";
  else if (edgeVoice)
    provider = "edge"; // TTS_VOICE in .env -> Edge neural voice
  else if (key) provider = "eleven";
  else provider = "say";

  if (provider === "edge" && !edgeVoice) {
    console.warn(
      `[voiceover:${lang}] --edge requested but no TTS_VOICE set; using local 'say'.`,
    );
    provider = "say";
  }

  // F5: batch (hard fail if it can't use your voice)
  let f5Map: Record<string, string> = {};
  if (provider === "f5") f5Map = await runF5Batch(lang, sb);

  // Edge: init one session up front; hard-fail if blocked (unless --allow-fallback)
  let edge: MsEdgeTTS | null = null;
  const prosody = edgeProsody();
  if (provider === "edge") {
    console.log(`[voiceover:${lang}] provider=edge voice=${edgeVoice}`);
    try {
      edge = await makeEdge(edgeVoice!);
      // probe once so we fail fast with a clear message if the WS is blocked
      await edgeToWav(
        edge,
        prosody,
        "test.",
        path.join(ROOT, "tmp", `edge-probe-${lang}.mp3`),
        path.join(ROOT, "tmp", `edge-probe-${lang}.wav`),
      );
    } catch (e: any) {
      const msg =
        `Edge TTS unreachable — "${edgeVoice}" was NOT used. ` +
        `Your network is blocking the Edge TTS websocket (speech.platform.bing.com). ` +
        `Run on a VPN/network that doesn't intercept it. Detail: ${(e.message || e).toString()}`;
      if (!allowFallback) throw new Error(msg);
      console.warn(
        `[voiceover:${lang}] ${msg}\n  --allow-fallback set: using local 'say' (${map.sayVoice}).`,
      );
      provider = "say";
      edge = null;
    }
  } else if (provider !== "f5") {
    console.log(
      `[voiceover:${lang}] provider=${provider} voice=${provider === "eleven" ? map.elevenlabsVoiceId : map.sayVoice}`,
    );
  }

  const pubDir = path.join(ROOT, "public", "narration", lang);
  const tmpDir = path.join(ROOT, "tmp", lang);
  await fs.mkdir(pubDir, { recursive: true });
  await fs.mkdir(tmpDir, { recursive: true });

  const sceneWavs: string[] = [];
  let total = 0;
  let elevenFailed = false;

  for (const scene of sb.scenes) {
    const wav = path.join(tmpDir, `${scene.id}.wav`);
    const text: string = (scene.narration ?? "").trim();

    if (text.length > 0) {
      if (provider === "f5") {
        const pad = (F5.scenePauseMs / 1000).toFixed(3);
        await ffmpeg([
          "-y",
          "-i",
          f5Map[scene.id],
          "-ar",
          "44100",
          "-ac",
          "2",
          "-af",
          `apad=pad_dur=${pad}`,
          wav,
        ]);
      } else if (provider === "edge" && edge) {
        await edgeToWav(
          edge,
          prosody,
          normalizeForTTS(text),
          path.join(tmpDir, `${scene.id}.mp3`),
          wav,
        );
      } else if (provider === "eleven" && !elevenFailed) {
        try {
          await elevenToWav(
            key!,
            map.elevenlabsVoiceId,
            text,
            path.join(tmpDir, `${scene.id}.mp3`),
            wav,
          );
        } catch (e) {
          console.warn(
            `[voiceover:${lang}] ElevenLabs failed (${(e as Error).message}); falling back to 'say'.`,
          );
          elevenFailed = true;
          await sayToWav(
            map.sayVoice,
            text,
            path.join(tmpDir, `${scene.id}.aiff`),
            wav,
          );
        }
      } else {
        await sayToWav(
          map.sayVoice,
          text,
          path.join(tmpDir, `${scene.id}.aiff`),
          wav,
        );
      }
    } else {
      const dur = scene.durationSec || 2;
      await ffmpeg([
        "-y",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=44100:cl=stereo",
        "-t",
        String(dur),
        wav,
      ]);
    }

    const dur = await probeDurationSec(wav);
    scene.durationSec = Number(dur.toFixed(3));
    total += dur;
    sceneWavs.push(wav);
  }

  if (edge) edge.close();

  const listFile = path.join(tmpDir, "list.txt");
  await fs.writeFile(
    listFile,
    sceneWavs.map((w) => `file '${w.replace(/'/g, "'\\''")}'`).join("\n"),
  );
  const full = path.join(pubDir, "full.wav");
  await ffmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-c",
    "copy",
    full,
  ]);

  const full16k = path.join(tmpDir, "full16k.wav");
  await ffmpeg(["-y", "-i", full, "-ar", "16000", "-ac", "1", full16k]);

  sb.totalSeconds = Number(total.toFixed(3));
  sb.audio = `narration/${lang}/full.wav`;
  await fs.writeFile(sbPath, JSON.stringify(sb, null, 2));

  console.log(
    `[voiceover:${lang}] ${sb.scenes.length} scenes, ${sb.totalSeconds}s total (provider=${provider})`,
  );
  return { storyboardPath: sbPath, full16k };
}
