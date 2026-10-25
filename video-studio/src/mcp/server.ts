#!/usr/bin/env node
/**
 * video-studio MCP server
 * ------------------------------------------------------------------
 * Exposes the video pipeline as Model Context Protocol tools so any MCP
 * client (Kiro, Claude Desktop, Codex, etc.) can author storyboards and
 * produce videos.
 *
 * Design for robustness (the pipeline must never take the server down):
 *  - stdout is reserved for the JSON-RPC transport. Every console.* in this
 *    process is routed to stderr, and all heavy pipeline steps run as ISOLATED
 *    child processes whose stdout/stderr are captured (never inherited). A
 *    Remotion/ffmpeg crash kills only the child, not the server.
 *  - Long operations (voiceover/captions/render/formats/thumbnails) are async
 *    JOBS: the tool returns a jobId immediately; clients poll get_job_status.
 *  - Production jobs are SERIALIZED through a queue because they write to shared
 *    files (out/, input/captions.*, public/narration/*). No two renders clobber
 *    each other.
 *  - Every tool handler is wrapped: it returns a structured error instead of
 *    throwing, and process-level guards keep the server alive on unexpected
 *    faults.
 */
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawn, ChildProcess, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { validateStoryboard, lintStoryboard } from "../pipeline/validate.js";
import { PRESETS, VOICE_BY_LANG } from "../config.js";
import { AUDIO, resolveAudioConfig } from "../audio.config.js";

// --- stdout protection: route all console output to stderr --------------------
// The stdio transport owns process.stdout. Anything written there that is not a
// framed JSON-RPC message corrupts the stream and breaks the client.
for (const m of ["log", "info", "warn", "debug", "trace"] as const) {
  (console as any)[m] = (...args: any[]) =>
    process.stderr.write(
      args
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join(" ") + "\n",
    );
}

// --- paths --------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// src/mcp/server.ts -> video-studio root is two levels up.
const ROOT = path.resolve(__dirname, "..", "..");
// Pipeline modules use process.cwd(); anchor it to the project root regardless
// of where the client launches us from.
try {
  process.chdir(ROOT);
} catch {
  /* keep going; paths are also absolute via ROOT */
}

const TSX = path.join(ROOT, "node_modules", ".bin", "tsx");
const INPUT_DIR = path.join(ROOT, "input");
const OUT_DIR = path.join(ROOT, "out");

// --- helpers ------------------------------------------------------------------
const LANG_RE = /^[a-z]{2}(-[a-z0-9]+)?$/i;

function assertLang(lang: string): string {
  if (typeof lang !== "string" || !LANG_RE.test(lang))
    throw new Error(
      `invalid lang "${lang}" (expected a code like "en" or "hi", letters/hyphen only)`,
    );
  return lang;
}

// Guard against path traversal: resolved path must stay inside ROOT.
function insideRoot(p: string): string {
  const abs = path.resolve(ROOT, p);
  const rel = path.relative(ROOT, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel))
    throw new Error(`path escapes project root: ${p}`);
  return abs;
}

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}
function fail(message: string, extra: Record<string, unknown> = {}) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ ok: false, error: message, ...extra }, null, 2),
      },
    ],
  };
}
// Wrap a handler so it can never throw out of the tool call.
function guard<A extends any[]>(fn: (...a: A) => Promise<any> | any) {
  return async (...a: A) => {
    try {
      return await fn(...a);
    } catch (e: any) {
      return fail(e?.message ? String(e.message) : String(e));
    }
  };
}

async function readJson(file: string): Promise<any> {
  const txt = await fsp.readFile(file, "utf8");
  return JSON.parse(txt);
}

// ============================================================================
// Job engine
// ============================================================================
type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
const LOG_CAP = 600;

interface Job {
  id: string;
  type: string;
  lang: string;
  command: string;
  args: string[];
  status: JobStatus;
  stage: string;
  progress: number; // 0..100
  log: string[];
  notes: string[]; // human-relevant quality notes (fallbacks etc.)
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  exitCode?: number | null;
  error?: string;
  outputs: string[];
  resolveOutputs: () => Promise<string[]>;
  child?: ChildProcess;
  cancelRequested?: boolean;
}

const jobs = new Map<string, Job>();
const queue: Job[] = [];
let active: Job | null = null;

function pushLog(job: Job, chunk: string) {
  const lines = chunk.split(/\r?\n/).filter((l) => l.length > 0);
  for (const line of lines) {
    job.log.push(line);
    if (job.log.length > LOG_CAP) job.log.shift();

    // derive progress from a trailing "NN%" token
    const pm = line.match(/(\d{1,3})\s*%/);
    if (pm) {
      const v = Math.max(0, Math.min(100, parseInt(pm[1], 10)));
      if (!Number.isNaN(v)) job.progress = v;
    }
    // derive stage from "[stage:" or "[stage]" markers
    const sm = line.match(
      /\[(validate|voiceover|captions|render|finalize|formats|thumb|sfx|make)[:\]]/,
    );
    if (sm) job.stage = sm[1];

    // surface quality-relevant fallbacks so callers understand the result
    if (/ElevenLabs failed|Edge TTS unreachable|was NOT used/i.test(line))
      job.notes.push(line.trim());
    if (/Whisper unavailable|synthetic alignment/i.test(line))
      job.notes.push(line.trim());
    if (/no music bed|finalize skipped|sfx skipped/i.test(line))
      job.notes.push(line.trim());
  }
  // keep notes unique + bounded
  job.notes = [...new Set(job.notes)].slice(-20);
}

function enqueueJob(
  partial: Omit<
    Job,
    | "id"
    | "status"
    | "stage"
    | "progress"
    | "log"
    | "notes"
    | "createdAt"
    | "outputs"
  >,
): Job {
  const job: Job = {
    ...partial,
    id: randomUUID(),
    status: "queued",
    stage: "queued",
    progress: 0,
    log: [],
    notes: [],
    createdAt: new Date().toISOString(),
    outputs: [],
  };
  jobs.set(job.id, job);
  queue.push(job);
  queueTick();
  return job;
}

function queueTick() {
  if (active) return;
  const next = queue.shift();
  if (!next) return;
  if (next.cancelRequested) {
    next.status = "cancelled";
    next.endedAt = new Date().toISOString();
    queueTick();
    return;
  }
  runJob(next);
}

function runJob(job: Job) {
  active = job;
  job.status = "running";
  job.stage = "starting";
  job.startedAt = new Date().toISOString();

  let child: ChildProcess;
  try {
    child = spawn(job.command, job.args, {
      cwd: ROOT,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e: any) {
    job.status = "failed";
    job.error = `failed to spawn: ${e?.message ?? e}`;
    job.endedAt = new Date().toISOString();
    active = null;
    queueTick();
    return;
  }
  job.child = child;

  child.stdout?.on("data", (d) => pushLog(job, d.toString()));
  child.stderr?.on("data", (d) => pushLog(job, d.toString()));

  child.on("error", (e) => {
    job.notes.push(`spawn error: ${e.message}`);
  });

  child.on("close", async (code) => {
    job.exitCode = code;
    job.endedAt = new Date().toISOString();
    job.child = undefined;
    if (job.cancelRequested) {
      job.status = "cancelled";
    } else if (code === 0) {
      job.status = "completed";
      job.progress = 100;
      job.stage = "done";
      try {
        job.outputs = await job.resolveOutputs();
      } catch {
        job.outputs = [];
      }
    } else {
      job.status = "failed";
      job.error =
        `process exited with code ${code}. Last lines:\n` +
        job.log.slice(-15).join("\n");
    }
    active = null;
    queueTick();
  });
}

function cancelJob(id: string): { ok: boolean; message: string } {
  const job = jobs.get(id);
  if (!job) return { ok: false, message: `no job ${id}` };
  if (job.status === "queued") {
    job.cancelRequested = true;
    const i = queue.indexOf(job);
    if (i >= 0) queue.splice(i, 1);
    job.status = "cancelled";
    job.endedAt = new Date().toISOString();
    return { ok: true, message: "cancelled queued job" };
  }
  if (job.status === "running") {
    job.cancelRequested = true;
    try {
      job.child?.kill("SIGTERM");
      const c = job.child;
      setTimeout(() => {
        if (c && !c.killed) c.kill("SIGKILL");
      }, 3000);
    } catch {
      /* ignore */
    }
    return { ok: true, message: "termination requested" };
  }
  return { ok: false, message: `job already ${job.status}` };
}

async function existing(paths: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const p of paths) {
    try {
      await fsp.access(p);
      out.push(p);
    } catch {
      /* not produced */
    }
  }
  return out;
}

function jobView(job: Job, logLines = 25) {
  return {
    id: job.id,
    type: job.type,
    lang: job.lang,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    notes: job.notes,
    outputs: job.outputs,
    error: job.error,
    exitCode: job.exitCode,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    endedAt: job.endedAt,
    queuePosition: job.status === "queued" ? queue.indexOf(job) + 1 : undefined,
    logTail: job.log.slice(-logLines),
  };
}

// Build spawn args for a pipeline script run via tsx.
function pipelineArgs(script: string, ...rest: string[]): string[] {
  return [path.join(ROOT, "src", "pipeline", script), ...rest];
}

// ============================================================================
// Static catalogs (schema discovery) — kept here so clients never need source
// ============================================================================
const LOOK_IDS = [
  "code2offer",
  "neo-grotesk",
  "ultra",
  "instrument",
  "bold-poster",
  "broadside",
  "coral",
  "creative-mode",
  "cobalt-grid",
  "capsule",
  "biennale-yellow",
  "blockframe",
  "blue-professional",
  "cartesian",
  "daisy-days",
  "editorial-forest",
];

const TEMPLATES: Record<
  string,
  { summary: string; required: string[]; optional: string[]; example: any }
> = {
  hook: {
    summary:
      "Punchy full-bleed opener for the first ~1.5s. Keep heading to a few words — it scales huge.",
    required: ["text.heading"],
    optional: ["text.kicker", "text.sub", "text.fill(solid|gradient|outline)"],
    example: {
      id: "s1",
      template: "hook",
      narration: "Stop doing X the hard way.",
      text: {
        kicker: "Wait",
        heading: "Do it in one line",
        sub: "the trick",
        fill: "gradient",
      },
    },
  },
  title: {
    summary: "Standard title card with kicker/heading/sub.",
    required: ["text.heading"],
    optional: ["text.kicker", "text.sub", "text.fill", "motion(kinetic)"],
    example: {
      id: "s2",
      template: "title",
      motion: "kinetic",
      narration: "Here is the idea.",
      text: {
        kicker: "Overview",
        heading: "The idea",
        sub: "in a minute",
        fill: "gradient",
      },
    },
  },
  bullets: {
    summary: "Animated bullet list of key points.",
    required: ["text.bullets (non-empty string[])"],
    optional: ["text.kicker", "text.heading"],
    example: {
      id: "s3",
      template: "bullets",
      narration: "Three things to remember.",
      text: {
        kicker: "Takeaway",
        heading: "Remember this",
        bullets: ["first point", "second point", "third point"],
      },
    },
  },
  code: {
    summary:
      "Editor window with typewriter code reveal. Put explanations in footnote (only // comments are detected).",
    required: ["text.code (non-empty string[])"],
    optional: [
      "text.heading",
      "text.windowLabel",
      "text.footnote",
      "text.fontSize | text.codeScale (bigger code; clamped to fit unless text.wrap)",
      "text.wrap (let long lines wrap so they can be larger)",
      "text.output (string|string[]) shown in an OUTPUT panel that pops in after typing",
      "text.outputLabel",
      "text.highlights ([{line,start,dur,color}] — time-synced line highlights)",
      "text.error ({line,at,message,shake}) — red border on a line + red error in the output + a card shake when it fires",
    ],
    example: {
      id: "s4",
      template: "code",
      narration: "Here it is in code.",
      text: {
        heading: "Example",
        windowLabel: "demo.py",
        footnote: "one-line takeaway",
        output: ["[0, 1, 4, 9, 16]"],
        highlights: [{ line: 1, start: 1.2 }],
        code: ["squares = [n*n for n in range(5)]"],
      },
    },
  },
  diagram: {
    summary: "Row/column of labelled boxes for simple architecture or flow.",
    required: [
      "text.diagram.boxes (non-empty array of {title, items?:string[]})",
    ],
    optional: ["text.heading", "text.diagram.accentIndex"],
    example: {
      id: "s5",
      template: "diagram",
      narration: "How it fits together.",
      text: {
        heading: "How it works",
        diagram: {
          accentIndex: 1,
          boxes: [
            { title: "input", items: ["what goes in"] },
            { title: "process", items: ["key step"] },
            { title: "output", items: ["result"] },
          ],
        },
      },
    },
  },
  stat: {
    summary: "One big number/metric with context.",
    required: ['text.value (e.g. "16ms", "3x", "99%")'],
    optional: ["text.kicker", "text.sub", "text.fill"],
    example: {
      id: "s6",
      template: "stat",
      narration: "The payoff.",
      text: { kicker: "Result", value: "10x", sub: "faster", fill: "gradient" },
    },
  },
  chart: {
    summary: "Animated bar or line chart.",
    required: ["text.chart.data (array of {label, value:number, color?})"],
    optional: [
      "text.heading",
      "text.kicker",
      "text.chart.type(bar|line)",
      "text.chart.unit",
      "text.chart.max",
    ],
    example: {
      id: "s7",
      template: "chart",
      narration: "The numbers.",
      text: {
        heading: "Latency",
        chart: {
          type: "bar",
          unit: "ms",
          data: [
            { label: "A", value: 120 },
            { label: "B", value: 45 },
          ],
        },
      },
    },
  },
  compare: {
    summary:
      "Side-by-side (or stacked on portrait) comparison with tone marks (good ✓ / bad ✗ / neutral •).",
    required: [
      "text.compare.left",
      "text.compare.right (each {label, tone?, items?:string[], value?})",
    ],
    optional: ["text.heading", "text.kicker", "text.compare.divider"],
    example: {
      id: "s8",
      template: "compare",
      narration: "Before vs after.",
      text: {
        heading: "Before vs after",
        compare: {
          divider: "VS",
          left: { label: "old", tone: "bad", items: ["slow", "verbose"] },
          right: { label: "new", tone: "good", items: ["fast", "clean"] },
        },
      },
    },
  },
  cta: {
    summary: "Closing call to action.",
    required: ["text.heading"],
    optional: ["text.sub"],
    example: {
      id: "s9",
      template: "cta",
      narration: "Follow for more.",
      text: { heading: "Follow for daily tips", sub: "@code2offer" },
    },
  },
  tokens: {
    summary:
      "Advanced: animated token/word chips. Provide text.tokens as a non-empty array.",
    required: ["text.tokens (non-empty array)"],
    optional: ["text.heading", "text.kicker"],
    example: {
      id: "s10",
      template: "tokens",
      narration: "The pieces.",
      text: { heading: "Pieces", tokens: ["const", "let", "var"] },
    },
  },
  broll: {
    summary:
      "Full-frame background media (image/video) with optional overlay text. A placeholder renders if media.src is missing.",
    required: [],
    optional: ["media.src", "text.heading", "text.sub"],
    example: {
      id: "s11",
      template: "broll",
      narration: "Watch this.",
      media: { src: "assets/clip.mp4" },
      text: { heading: "In action" },
    },
  },
  interstitial: {
    summary: "Short transitional beat between sections.",
    required: [],
    optional: ["text.heading", "text.kicker"],
    example: {
      id: "s12",
      template: "interstitial",
      narration: "Next up.",
      text: { kicker: "Part 2", heading: "The details" },
    },
  },
  terminal: {
    summary:
      "A terminal window: a prompt + typed command, then the output appears. For CLI tips and 'run it and see'.",
    required: ["text.command"],
    optional: [
      "text.heading",
      "text.prompt",
      "text.output",
      "text.windowLabel",
      "text.fontSize",
    ],
    example: {
      id: "s13",
      template: "terminal",
      narration: "Install it in one line.",
      text: {
        heading: "Install",
        prompt: "$",
        command: "pip install rich",
        output: ["Successfully installed rich"],
      },
    },
  },
  diff: {
    summary:
      "A git-style diff: lines starting with '+' are added (green), '-' removed (red), others are context. Great for 'the long way vs the trick'.",
    required: ["text.diff (or text.code), lines prefixed with + / - / space"],
    optional: ["text.heading", "text.windowLabel", "text.fontSize"],
    example: {
      id: "s14",
      template: "diff",
      narration: "Refactor it.",
      text: {
        heading: "Before vs after",
        diff: [
          "- squares = []",
          "- for n in nums:",
          "-     squares.append(n*n)",
          "+ squares = [n*n for n in nums]",
        ],
      },
    },
  },
  beforeafter: {
    summary:
      "Two code cards — a red 'before' (− lines, the old way) and a green 'after' (+ lines, the fix). The after card pops in and the before recedes. The 'stop doing this → do this' format.",
    required: ["text.before.code (string[])", "text.after.code (string[])"],
    optional: [
      "text.heading",
      "text.before.label",
      "text.after.label",
      "text.fontSize",
      "text.dimBefore (fade the before card once after lands; default true)",
    ],
    example: {
      id: "s15",
      template: "beforeafter",
      narration: "Stop writing the loop. Use a comprehension.",
      text: {
        heading: "The long way vs the trick",
        before: {
          label: "the long way",
          code: ["squares = []", "for n in nums:", "    squares.append(n*n)"],
        },
        after: { label: "the trick", code: ["squares = [n*n for n in nums]"] },
      },
    },
  },
};

const PROVIDERS = ["eleven", "edge", "say", "f5"] as const;

// ============================================================================
// Server + tools
// ============================================================================
const server = new McpServer({ name: "video-studio", version: "1.0.0" });

// ---- discovery ----
server.registerTool(
  "describe_storyboard_format",
  {
    title: "Describe storyboard format",
    description:
      "Returns the full storyboard JSON contract: top-level fields, style options, the scene shape, and how the pipeline treats durations/audio/captions. Call this first when authoring a storyboard.",
    inputSchema: {},
  },
  guard(async () =>
    ok({
      topLevel: {
        title: "string",
        platform: "one of: " + Object.keys(PRESETS).join(", "),
        language: 'string, e.g. "en"',
        width: "number (set from platform preset; e.g. 1080)",
        height: "number (e.g. 1920 for vertical)",
        fps: "number (usually 30)",
        totalSeconds: "number — AUTO-OVERWRITTEN by the voiceover step",
        audio: 'string — AUTO-SET to "narration/<lang>/full.wav"',
        style: {
          look: "look id (see list_looks)",
          captionStyle: "karaoke | block | minimal",
          transitionFamily:
            "default transition between scenes: cut | fade | slide | slideup | push | pushleft | wipe | clock | flip | zoom",
          transitionFrames: "optional transition length in frames (default 9)",
          progressBar:
            "optional retention bar: true, or { position:'top'|'bottom', color, thickness, track }",
          captions:
            "optional caption controls: { style?, position? (0..1 from bottom), maxWords? }",
          palette: "optional {bg,fg,accent,accent2,card} override",
        },
        scenes: "array of scene objects (see sceneShape)",
      },
      sceneShape: {
        id: "string, unique (required)",
        template:
          "one of: " + Object.keys(TEMPLATES).join(", ") + " (required)",
        narration:
          "string — spoken by TTS; also drives captions and the measured scene duration",
        durationSec:
          "number — placeholder only; the voiceover step re-measures and overwrites it from the actual audio",
        motion: 'optional, e.g. "kinetic"',
        text: "template-specific content (see list_templates)",
        media: "optional {src} for broll",
        transition:
          "optional VISUAL transition family INTO this scene, overriding style.transitionFamily: cut | fade | slide | slideup | push | pushleft | wipe | clock | flip | zoom",
        transitionSfx:
          "optional audio override for this scene's entry whoosh: a cue name string, {cue,gain,offset}, or false to mute it",
        sfx: 'optional in-scene accent sound(s): a cue name, {cue,gain,offset}, or an array of those (e.g. a "pop" when code appears). offset is seconds from scene start',
        annotations:
          "optional array of on-screen callouts rendered in frame space (below captions). Each: {type, start, in?, dur?, out?, color?, ...geometry}. types: spotlight{x,y,w,h|r,shape,dim}, box{x,y,w,h,label?}, arrow{x,y,fromX?,fromY?}, underline{x,y,w}, label{x,y,text}, pointer{x,y,from?,click?}. x/y/w/h in % of frame; timing in seconds.",
        zoom: "optional editor-style focus zoom (camera push-in on a region). {x,y,scale,start,in,hold?,out?,drift?,dim?}: x/y are % of the frame (0-100), scale is the zoom level, start/in/hold/out are seconds. drift (default 0.045) adds a slow Ken Burns push; dim (default 0.32) adds a vignette toward the focal point; set either to 0 to disable. Pass an ARRAY of steps to pan focus between regions. Captions stay fixed; omit out to hold the zoom to the scene end.",
      },
      sound: {
        _info:
          "Optional top-level audio config. Defaults are low and subtle; omit to use them. Overrides src/audio.config.ts; brand.json (music/musicVolume) is also honoured.",
        music: {
          enabled: "boolean (default true)",
          file: "string|null — a music file path, OR a bare name resolved from input/music/<name>.<ext>, OR null for a synthesized bed. input/music/default.<ext> is auto-used if present.",
          mood: "synth-bed mood when no file: calm | warm | bright | tense (default calm)",
          volume: "number, kept low (default 0.07)",
          fadeInSec: "number",
          fadeOutSec: "number",
          duck: "{threshold,ratio,attack,release} — music dips under the voiceover",
        },
        sfx: {
          enabled: "boolean (default true)",
          masterGain: "number — multiplies every cue (default 0.35, low)",
          autoTransition:
            '{enabled,cue,gain,offset,skipFirst} — plays a sound at each scene boundary (default a "whoosh")',
          library: "optional map to add/override cue recipes",
        },
        cues: "built-in cue names: pop, click, tick, ding, whoosh, swoosh, riser (drop input/sfx/<name>.<ext> to override any with your own file)",
      },
      notes: [
        "Authoring loop: write_storyboard -> generate_video. Durations and totalSeconds are measured from the generated audio, so approximate durationSec values are fine.",
        "Captions and narration/full.wav are produced by the pipeline; do not hand-author them.",
      ],
      platforms: PRESETS,
    }),
  ),
);

server.registerTool(
  "list_templates",
  {
    title: "List scene templates",
    description:
      "Lists every scene template with its required/optional fields and a copy-pasteable example. Use these to build valid scenes.",
    inputSchema: {},
  },
  guard(async () => ok({ templates: TEMPLATES })),
);

server.registerTool(
  "list_looks",
  {
    title: "List visual looks",
    description: "Lists the art-direction look ids usable in style.look.",
    inputSchema: {},
  },
  guard(async () => ok({ looks: LOOK_IDS, default: "neo-grotesk" })),
);

server.registerTool(
  "list_presets",
  {
    title: "List platform presets",
    description:
      "Lists platform presets (resolution, fps, max duration) for the platform / width / height fields.",
    inputSchema: {},
  },
  guard(async () => ok({ presets: PRESETS })),
);

server.registerTool(
  "list_voices",
  {
    title: "List TTS providers and voices",
    description:
      "Lists available TTS providers and the per-language voice map. The active provider auto-detects from env (ElevenLabs key -> eleven, else say) unless you pass one to generate_video/generate_voiceover.",
    inputSchema: {},
  },
  guard(async () =>
    ok({
      providers: PROVIDERS,
      perLanguage: VOICE_BY_LANG,
      notes: [
        "eleven: needs ELEVEN_LABS_KEY / ELEVENLABS_API_KEY in the environment; falls back to 'say' if it fails.",
        "edge: Microsoft neural voices (free) but requires network; fails fast unless allowFallback is set.",
        "say: offline macOS voices (always available on macOS).",
        "f5: local cloned voice; needs input/voice/reference.wav + a python 3.11-3.13 (F5_PYTHON).",
      ],
    }),
  ),
);

server.registerTool(
  "get_audio_config",
  {
    title: "Get resolved audio config",
    description:
      "Returns the effective audio config (music + sfx) for a language: the defaults from src/audio.config.ts merged with brand.json and the storyboard's `sound` block. Omit lang to see the raw defaults.",
    inputSchema: {
      lang: z
        .string()
        .optional()
        .describe("language code; omit for defaults only"),
    },
  },
  guard(async ({ lang }: { lang?: string }) => {
    if (!lang) return ok({ source: "defaults", config: AUDIO });
    assertLang(lang);
    let sb: any = {};
    let brand: any = {};
    let hasStoryboard = false;
    try {
      sb = await readJson(path.join(INPUT_DIR, `storyboard.${lang}.json`));
      hasStoryboard = true;
    } catch {
      /* fall back to defaults */
    }
    try {
      brand = await readJson(path.join(INPUT_DIR, "brand.json"));
    } catch {
      /* no brand */
    }
    return ok({
      source: hasStoryboard
        ? "defaults+brand+storyboard.sound"
        : "defaults+brand",
      storyboardSound: sb?.sound ?? null,
      config: resolveAudioConfig(sb, brand),
    });
  }),
);

server.registerTool(
  "list_sfx_cues",
  {
    title: "List SFX cues",
    description:
      "Lists the built-in SFX cue names and flags which have a user override file in input/sfx/.",
    inputSchema: {},
  },
  guard(async () => {
    const builtins = Object.keys(AUDIO.sfx.library);
    const exts = ["wav", "mp3", "m4a", "aac", "ogg", "flac"];
    let userFiles: string[] = [];
    try {
      userFiles = await fsp.readdir(path.join(INPUT_DIR, "sfx"));
    } catch {
      /* no overrides dir */
    }
    const overridden = new Set(
      userFiles
        .filter((f) => exts.includes((f.split(".").pop() || "").toLowerCase()))
        .map((f) => f.replace(/\.[^.]+$/, "")),
    );
    return ok({
      cues: builtins.map((name) => ({
        name,
        overridden: overridden.has(name),
      })),
      autoTransitionDefault: AUDIO.sfx.autoTransition.cue,
      note: "Drop input/sfx/<name>.<ext> to override any cue, or input/music/<name>.<ext> for music.",
    });
  }),
);

server.registerTool(
  "lint_storyboard",
  {
    title: "Lint a storyboard",
    description:
      "Non-fatal quality checks for a storyboard.<lang>.json: handle consistency, length vs the platform limit, text overflow / safe-zone heuristics, and pacing. Returns warnings + notes. Run before generate_video to catch off-brand or broken-looking output.",
    inputSchema: { lang: z.string().default("en") },
  },
  guard(async ({ lang }: { lang: string }) => {
    assertLang(lang);
    const sb = await readJson(path.join(INPUT_DIR, `storyboard.${lang}.json`));
    let brand: any = {};
    try {
      brand = await readJson(path.join(INPUT_DIR, "brand.json"));
    } catch {
      /* no brand */
    }
    const { warnings, notes } = lintStoryboard(sb, brand);
    return ok({ clean: warnings.length === 0, warnings, notes });
  }),
);

// ---- storyboard CRUD ----
server.registerTool(
  "list_storyboards",
  {
    title: "List storyboards",
    description: "Lists storyboard JSON files in the input/ directory.",
    inputSchema: {},
  },
  guard(async () => {
    const files = await fsp.readdir(INPUT_DIR);
    const sb = files.filter((f) => /^storyboard\..+\.json$/.test(f)).sort();
    return ok({ storyboards: sb });
  }),
);

server.registerTool(
  "read_storyboard",
  {
    title: "Read a storyboard",
    description: "Returns the parsed storyboard.<lang>.json.",
    inputSchema: {
      lang: z.string().default("en").describe('language code, e.g. "en"'),
    },
  },
  guard(async ({ lang }: { lang: string }) => {
    assertLang(lang);
    const file = path.join(INPUT_DIR, `storyboard.${lang}.json`);
    const sb = await readJson(file);
    return ok({ file: path.relative(ROOT, file), storyboard: sb });
  }),
);

server.registerTool(
  "validate_storyboard",
  {
    title: "Validate a storyboard",
    description:
      "Validates a storyboard object against the pipeline contract WITHOUT writing it. Returns errors and warnings. Call before write_storyboard to self-correct.",
    inputSchema: {
      storyboard: z.any().describe("the storyboard object to validate"),
    },
  },
  guard(async ({ storyboard }: { storyboard: any }) => {
    const { errors, warnings } = validateStoryboard(storyboard);
    return ok({ valid: errors.length === 0, errors, warnings });
  }),
);

server.registerTool(
  "write_storyboard",
  {
    title: "Write a storyboard",
    description:
      "Validates then writes a storyboard to input/storyboard.<lang>.json. Refuses to write if validation fails. Backs up any existing file to <name>.bak.json.",
    inputSchema: {
      lang: z.string().default("en"),
      storyboard: z.any().describe("the full storyboard object"),
      backup: z
        .boolean()
        .default(true)
        .describe("back up an existing file first"),
    },
  },
  guard(
    async ({
      lang,
      storyboard,
      backup,
    }: {
      lang: string;
      storyboard: any;
      backup: boolean;
    }) => {
      assertLang(lang);
      const { errors, warnings } = validateStoryboard(storyboard);
      if (errors.length)
        return fail("storyboard failed validation; not written", {
          errors,
          warnings,
        });
      const file = path.join(INPUT_DIR, `storyboard.${lang}.json`);
      if (backup) {
        try {
          await fsp.access(file);
          await fsp.copyFile(
            file,
            path.join(INPUT_DIR, `storyboard.${lang}.bak.json`),
          );
        } catch {
          /* nothing to back up */
        }
      }
      await fsp.writeFile(file, JSON.stringify(storyboard, null, 2));
      return ok({ ok: true, file: path.relative(ROOT, file), warnings });
    },
  ),
);

server.registerTool(
  "scaffold_storyboard",
  {
    title: "Scaffold a storyboard skeleton",
    description:
      "Generates a complete, valid placeholder storyboard for a topic (hook -> title -> diagram -> code -> stat -> bullets -> cta) and writes it to input/storyboard.<lang>.json. Edit the narration/text afterwards, or pass your own via write_storyboard.",
    inputSchema: {
      topic: z.string().describe("the video topic"),
      look: z.string().default("neo-grotesk"),
      platform: z.string().default("short"),
      lang: z.string().default("en"),
    },
  },
  guard(
    async ({
      topic,
      look,
      platform,
      lang,
    }: {
      topic: string;
      look: string;
      platform: string;
      lang: string;
    }) => {
      assertLang(lang);
      if (!topic?.trim()) return fail("topic is required");
      const args = pipelineArgs(
        "scaffold.ts",
        topic,
        "--look",
        look,
        "--platform",
        platform,
        "--lang",
        lang,
      );
      const result = await runOnce(TSX, args);
      if (result.code !== 0)
        return fail("scaffold failed", { log: result.log.slice(-15) });
      const file = path.join(INPUT_DIR, `storyboard.${lang}.json`);
      const sb = await readJson(file);
      return ok({ ok: true, file: path.relative(ROOT, file), storyboard: sb });
    },
  ),
);

// Deep-merge plain objects (arrays and scalars are replaced). Used to patch a
// storyboard's `sound` block without clobbering sibling keys.
function deepMerge(base: any, patch: any): any {
  if (
    base &&
    typeof base === "object" &&
    !Array.isArray(base) &&
    patch &&
    typeof patch === "object" &&
    !Array.isArray(patch)
  ) {
    const out: any = { ...base };
    for (const k of Object.keys(patch)) out[k] = deepMerge(base[k], patch[k]);
    return out;
  }
  return patch;
}

server.registerTool(
  "set_audio_config",
  {
    title: "Set a storyboard's audio config",
    description:
      "Writes/updates the top-level `sound` block in storyboard.<lang>.json to toggle music/sfx or change volumes, ducking, the auto-transition cue, etc. By default it deep-merges into the existing block (set merge=false to replace). Re-validates and backs up before writing, then returns the resolved effective config.",
    inputSchema: {
      lang: z.string().default("en"),
      sound: z
        .any()
        .describe(
          'partial sound config, e.g. {"music":{"volume":0.05},"sfx":{"enabled":false}}',
        ),
      merge: z.boolean().default(true),
    },
  },
  guard(
    async ({
      lang,
      sound,
      merge,
    }: {
      lang: string;
      sound: any;
      merge: boolean;
    }) => {
      assertLang(lang);
      if (!sound || typeof sound !== "object" || Array.isArray(sound))
        return fail("`sound` must be an object");
      const file = path.join(INPUT_DIR, `storyboard.${lang}.json`);
      const sb = await readJson(file);
      sb.sound = merge ? deepMerge(sb.sound ?? {}, sound) : sound;
      const { errors, warnings } = validateStoryboard(sb);
      if (errors.length)
        return fail("resulting storyboard is invalid; not written", { errors });
      try {
        await fsp.copyFile(
          file,
          path.join(INPUT_DIR, `storyboard.${lang}.bak.json`),
        );
      } catch {
        /* nothing to back up */
      }
      await fsp.writeFile(file, JSON.stringify(sb, null, 2));
      let brand: any = {};
      try {
        brand = await readJson(path.join(INPUT_DIR, "brand.json"));
      } catch {
        /* no brand */
      }
      return ok({
        ok: true,
        sound: sb.sound,
        resolved: resolveAudioConfig(sb, brand),
        warnings,
      });
    },
  ),
);

// ---- production (async jobs) ----
const providerSchema = z
  .enum(PROVIDERS)
  .optional()
  .describe("TTS provider override");

server.registerTool(
  "generate_video",
  {
    title: "Generate a full video",
    description:
      "Runs the full pipeline (voiceover -> captions -> render) for a language and returns a jobId. Poll get_job_status. The storyboard.<lang>.json must already exist (use write_storyboard/scaffold_storyboard first).",
    inputSchema: {
      lang: z.string().default("en"),
      provider: providerSchema,
      captions: z
        .enum(["whisper", "synthetic", "none"])
        .default("whisper")
        .describe("caption source"),
      allowFallback: z
        .boolean()
        .default(false)
        .describe(
          "allow TTS fallback to local 'say' if the chosen provider is unreachable",
        ),
    },
  },
  guard(async ({ lang, provider, captions, allowFallback }: any) => {
    assertLang(lang);
    await ensureStoryboard(lang);
    const flags: string[] = [];
    if (provider) flags.push(`--${provider}`);
    if (allowFallback) flags.push("--allow-fallback");
    if (captions === "none") flags.push("--no-captions");
    if (captions === "synthetic") flags.push("--synthetic");
    const job = enqueueJob({
      type: "generate_video",
      lang,
      command: TSX,
      args: pipelineArgs("make.ts", lang, ...flags),
      resolveOutputs: () => existing([path.join(OUT_DIR, `video.${lang}.mp4`)]),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

server.registerTool(
  "generate_voiceover",
  {
    title: "Generate voiceover only",
    description:
      "Runs TTS for every scene, concatenates narration, and rewrites measured durations into the storyboard. Returns a jobId.",
    inputSchema: {
      lang: z.string().default("en"),
      provider: providerSchema,
      allowFallback: z.boolean().default(false),
    },
  },
  guard(async ({ lang, provider, allowFallback }: any) => {
    assertLang(lang);
    await ensureStoryboard(lang);
    const flags: string[] = [];
    if (provider) flags.push(`--${provider}`);
    if (allowFallback) flags.push("--allow-fallback");
    const job = enqueueJob({
      type: "generate_voiceover",
      lang,
      command: TSX,
      args: pipelineArgs("voiceover.ts", lang, ...flags),
      resolveOutputs: () =>
        existing([path.join(ROOT, "public", "narration", lang, "full.wav")]),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

server.registerTool(
  "generate_captions",
  {
    title: "Generate captions",
    description:
      "Produces input/captions.<lang>.json. mode=whisper uses word-level Whisper alignment (requires a prior voiceover run so tmp/<lang>/full16k.wav exists and a network to fetch the model). mode=synthetic distributes words evenly over each scene's measured audio (offline, always works). Returns a jobId.",
    inputSchema: {
      lang: z.string().default("en"),
      mode: z.enum(["whisper", "synthetic"]).default("whisper"),
    },
  },
  guard(async ({ lang, mode }: any) => {
    assertLang(lang);
    await ensureStoryboard(lang);
    const script =
      mode === "synthetic" ? "captions-fallback.ts" : "captions.ts";
    const job = enqueueJob({
      type: `generate_captions:${mode}`,
      lang,
      command: TSX,
      args: pipelineArgs(script, lang),
      resolveOutputs: () =>
        existing([path.join(INPUT_DIR, `captions.${lang}.json`)]),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

server.registerTool(
  "render_video",
  {
    title: "Render video (uses existing audio/captions)",
    description:
      "Renders the MP4 from the current storyboard, narration audio, and captions, then normalizes loudness and mixes any sfx. Does NOT regenerate voiceover. Returns a jobId.",
    inputSchema: { lang: z.string().default("en") },
  },
  guard(async ({ lang }: any) => {
    assertLang(lang);
    await ensureStoryboard(lang);
    const job = enqueueJob({
      type: "render_video",
      lang,
      command: TSX,
      args: pipelineArgs("render.ts", lang),
      resolveOutputs: () => existing([path.join(OUT_DIR, `video.${lang}.mp4`)]),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

server.registerTool(
  "render_formats",
  {
    title: "Render multiple aspect ratios",
    description:
      "Re-renders the same storyboard into multiple aspect ratios from one bundle. formats: vertical (1080x1920), square (1080x1080), wide (1920x1080). Returns a jobId.",
    inputSchema: {
      lang: z.string().default("en"),
      formats: z
        .array(z.enum(["vertical", "square", "wide"]))
        .default(["vertical", "square", "wide"]),
    },
  },
  guard(async ({ lang, formats }: any) => {
    assertLang(lang);
    await ensureStoryboard(lang);
    const which: string[] = formats?.length
      ? formats
      : ["vertical", "square", "wide"];
    const job = enqueueJob({
      type: "render_formats",
      lang,
      command: TSX,
      args: pipelineArgs("formats.ts", lang, which.join(",")),
      resolveOutputs: () =>
        existing(
          which.map((f: string) =>
            path.join(OUT_DIR, `video.${lang}.${f}.mp4`),
          ),
        ),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

server.registerTool(
  "generate_thumbnails",
  {
    title: "Generate thumbnails",
    description:
      "Renders short and long thumbnail stills (out/thumb.<lang>.short.png / .long.png) from the storyboard's title scene and brand. Returns a jobId.",
    inputSchema: { lang: z.string().default("en") },
  },
  guard(async ({ lang }: any) => {
    assertLang(lang);
    await ensureStoryboard(lang);
    const job = enqueueJob({
      type: "generate_thumbnails",
      lang,
      command: TSX,
      args: pipelineArgs("thumbnail.ts", lang),
      resolveOutputs: () =>
        existing([
          path.join(OUT_DIR, `thumb.${lang}.short.png`),
          path.join(OUT_DIR, `thumb.${lang}.long.png`),
        ]),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

server.registerTool(
  "preview_audio",
  {
    title: "Preview the sound design (audio only)",
    description:
      "Renders a short AUDIO-ONLY preview (out/audio-preview.<lang>.wav) of the music bed ducked under the existing narration plus the SFX cues in the window — mixed exactly like the real pipeline. Fast, no video render. Great for tuning volumes before a full render. Returns a jobId.",
    inputSchema: {
      lang: z.string().default("en"),
      seconds: z.number().int().min(2).max(30).default(12),
    },
  },
  guard(async ({ lang, seconds }: { lang: string; seconds: number }) => {
    assertLang(lang);
    await ensureStoryboard(lang);
    const job = enqueueJob({
      type: "preview_audio",
      lang,
      command: TSX,
      args: pipelineArgs("audio-preview.ts", lang, String(seconds)),
      resolveOutputs: () =>
        existing([path.join(OUT_DIR, `audio-preview.${lang}.wav`)]),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

server.registerTool(
  "qa_video",
  {
    title: "QA a rendered video",
    description:
      "Post-render checks on out/video.<lang>.mp4: integrated loudness (~-14 LUFS target), black-frame detection, and a 3x3 contact sheet (out/qa.<lang>.contact.png). Returns a jobId; read the log/outputs when done.",
    inputSchema: { lang: z.string().default("en") },
  },
  guard(async ({ lang }: { lang: string }) => {
    assertLang(lang);
    const job = enqueueJob({
      type: "qa_video",
      lang,
      command: TSX,
      args: pipelineArgs("qa.ts", lang),
      resolveOutputs: () =>
        existing([path.join(OUT_DIR, `qa.${lang}.contact.png`)]),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

server.registerTool(
  "run_code",
  {
    title: "Run code snippets to capture real output",
    description:
      'Executes snippets from code/terminal scenes that set "run": true (python/node/bash, inferred from windowLabel or runWith) and writes the real stdout into each scene\'s text.output. SECURITY: runs storyboard code on this machine (timeout, no sandbox) — only use on trusted storyboards. Returns a jobId.',
    inputSchema: { lang: z.string().default("en") },
  },
  guard(async ({ lang }: { lang: string }) => {
    assertLang(lang);
    await ensureStoryboard(lang);
    const job = enqueueJob({
      type: "run_code",
      lang,
      command: TSX,
      args: pipelineArgs("runcode.ts", lang),
      resolveOutputs: () =>
        existing([path.join(INPUT_DIR, `storyboard.${lang}.json`)]),
    });
    return ok({ jobId: job.id, status: job.status, poll: "get_job_status" });
  }),
);

// ---- job control ----
server.registerTool(
  "get_job_status",
  {
    title: "Get job status",
    description:
      "Returns status, stage, progress %, quality notes, resolved output paths, and a log tail for a job id.",
    inputSchema: {
      jobId: z.string(),
      logLines: z.number().int().min(0).max(LOG_CAP).default(25),
    },
  },
  guard(async ({ jobId, logLines }: any) => {
    const job = jobs.get(jobId);
    if (!job) return fail(`no job ${jobId}`);
    return ok(jobView(job, logLines));
  }),
);

server.registerTool(
  "list_jobs",
  {
    title: "List jobs",
    description: "Lists recent jobs (newest first).",
    inputSchema: { limit: z.number().int().min(1).max(100).default(20) },
  },
  guard(async ({ limit }: any) => {
    const all = [...jobs.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((j) => jobView(j, 0));
    return ok({ jobs: all, active: active?.id ?? null, queued: queue.length });
  }),
);

server.registerTool(
  "cancel_job",
  {
    title: "Cancel a job",
    description: "Cancels a queued job or terminates a running one.",
    inputSchema: { jobId: z.string() },
  },
  guard(async ({ jobId }: any) => {
    const r = cancelJob(jobId);
    return r.ok ? ok(r) : fail(r.message);
  }),
);

// ---- outputs ----
server.registerTool(
  "list_outputs",
  {
    title: "List output files",
    description: "Lists files in out/ with size and modified time.",
    inputSchema: {},
  },
  guard(async () => {
    let files: string[] = [];
    try {
      files = await fsp.readdir(OUT_DIR);
    } catch {
      return ok({ outputs: [] });
    }
    const outputs = [];
    for (const f of files.sort()) {
      try {
        const st = await fsp.stat(path.join(OUT_DIR, f));
        if (st.isFile())
          outputs.push({
            file: path.join("out", f),
            bytes: st.size,
            modified: st.mtime.toISOString(),
          });
      } catch {
        /* skip */
      }
    }
    return ok({ outputs });
  }),
);

server.registerTool(
  "get_output_info",
  {
    title: "Probe a media file",
    description:
      "Runs ffprobe on an output file (path relative to the project root, e.g. out/video.en.mp4) and returns duration, size, and stream info.",
    inputSchema: {
      file: z
        .string()
        .describe("path relative to project root, e.g. out/video.en.mp4"),
    },
  },
  guard(async ({ file }: any) => {
    const abs = insideRoot(file);
    await fsp.access(abs);
    const ffprobe = await resolveFfprobe();
    const info = await runOnce(ffprobe, [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size,bit_rate",
      "-show_entries",
      "stream=codec_type,codec_name,width,height",
      "-of",
      "json",
      abs,
    ]);
    if (info.code !== 0)
      return fail("ffprobe failed", { log: info.log.slice(-10) });
    let parsed: any = null;
    try {
      parsed = JSON.parse(info.log.join("\n"));
    } catch {
      /* return raw */
    }
    return ok({ file, info: parsed ?? info.log.join("\n") });
  }),
);

// ============================================================================
// small utilities that run a child process once and collect output
// ============================================================================
function runOnce(
  cmd: string,
  args: string[],
): Promise<{ code: number | null; log: string[] }> {
  return new Promise((resolve) => {
    const log: string[] = [];
    let child: ChildProcess;
    try {
      child = spawn(cmd, args, {
        cwd: ROOT,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e: any) {
      resolve({ code: 1, log: [`spawn error: ${e?.message ?? e}`] });
      return;
    }
    child.stdout?.on("data", (d) => log.push(...d.toString().split(/\r?\n/)));
    child.stderr?.on("data", (d) => log.push(...d.toString().split(/\r?\n/)));
    child.on("error", (e) => log.push(`error: ${e.message}`));
    child.on("close", (code) =>
      resolve({ code, log: log.filter((l) => l.length) }),
    );
  });
}

async function ensureStoryboard(lang: string): Promise<void> {
  const file = path.join(INPUT_DIR, `storyboard.${lang}.json`);
  try {
    await fsp.access(file);
  } catch {
    throw new Error(
      `no storyboard for "${lang}" (expected input/storyboard.${lang}.json). Create it with write_storyboard or scaffold_storyboard first.`,
    );
  }
}

async function resolveFfprobe(): Promise<string> {
  // Prefer the bundled ffprobe-static, fall back to PATH.
  try {
    const mod: any = await import("ffprobe-static");
    const p = mod?.path ?? mod?.default?.path;
    if (p && fs.existsSync(p)) return p;
  } catch {
    /* not available */
  }
  return "ffprobe";
}

// ============================================================================
// boot
// ============================================================================
process.on("uncaughtException", (e) => {
  process.stderr.write(
    `[video-studio-mcp] uncaughtException: ${e?.stack ?? e}\n`,
  );
});
process.on("unhandledRejection", (e: any) => {
  process.stderr.write(
    `[video-studio-mcp] unhandledRejection: ${e?.stack ?? e}\n`,
  );
});

async function main() {
  if (!fs.existsSync(TSX)) {
    process.stderr.write(
      `[video-studio-mcp] WARNING: tsx not found at ${TSX}. Run "npm install" in video-studio.\n`,
    );
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[video-studio-mcp] ready (stdio)\n");
}

main().catch((e) => {
  process.stderr.write(`[video-studio-mcp] fatal: ${e?.stack ?? e}\n`);
  process.exit(1);
});
