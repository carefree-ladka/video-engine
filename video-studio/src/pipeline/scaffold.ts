import fs from "node:fs/promises";
import path from "node:path";
import { assertValidStoryboard } from "./validate.js";

const ROOT = process.cwd();

// Template-based storyboard generator. Takes a topic and emits a complete,
// valid storyboard skeleton using the full scene vocabulary. Narration is
// placeholder prose you refine before rendering — this exists to kill the
// blank-page problem and 10x content velocity, not to auto-write final copy.
//
// It is LLM-ready: drop in a provider that fills `narration`/`text` from the
// topic (see fillWithLLM stub) and the rest of the pipeline is unchanged.

type Args = { topic: string; look: string; lang: string; platform: string };

function parseArgs(argv: string[]): Args {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) flags[a.slice(2)] = argv[++i] ?? "";
    else positional.push(a);
  }
  return {
    topic: positional.join(" ").trim() || "Your topic here",
    look: flags.look || "neo-grotesk",
    lang: flags.lang || "en",
    platform: flags.platform || "short",
  };
}

function buildStoryboard({ topic, look, platform }: Args) {
  const T = topic;
  return {
    title: T,
    platform,
    language: "en",
    width: 1080,
    height: 1920,
    fps: 30,
    totalSeconds: 45,
    audio: "narration/en/full.wav",
    style: { look, captionStyle: "karaoke", transitionFamily: "slide" },
    scenes: [
      {
        id: "s1",
        template: "hook",
        narration: `Most developers get ${T} wrong. Here's the part nobody explains.`,
        text: { kicker: "Wait", heading: `${T}, explained`, fill: "gradient" },
        durationSec: 4,
      },
      {
        id: "s2",
        template: "title",
        motion: "kinetic",
        narration: `Let's break down ${T} from scratch, fast.`,
        text: { kicker: "Overview", heading: T, sub: "in under a minute", fill: "gradient" },
        durationSec: 5,
      },
      {
        id: "s3",
        template: "diagram",
        narration: `At a high level, ${T} has a few moving parts. Here's how they fit together.`,
        text: {
          heading: "How it works",
          diagram: {
            accentIndex: 1,
            boxes: [
              { title: "input", items: ["what goes in"] },
              { title: "process", items: ["the key step"] },
              { title: "output", items: ["what you get"] },
            ],
          },
        },
        durationSec: 8,
      },
      {
        id: "s4",
        template: "code",
        narration: `Here it is in code. The important line is the one in the middle.`,
        text: {
          heading: "An example",
          windowLabel: "example.js",
          footnote: `TODO: one-line takeaway about ${T}.`,
          code: [
            "// TODO: replace with a real snippet",
            "function example() {",
            "  return 'edit me';",
            "}",
          ],
        },
        durationSec: 8,
      },
      {
        id: "s5",
        template: "stat",
        narration: `And the payoff: the number that makes ${T} worth it.`,
        text: { kicker: "Result", value: "10x", sub: "TODO: context for the number", fill: "gradient" },
        durationSec: 7,
      },
      {
        id: "s6",
        template: "bullets",
        narration: `Three things to remember about ${T}.`,
        text: {
          kicker: "Takeaway",
          heading: "Remember this",
          bullets: ["first key point", "second key point", "third key point"],
        },
        durationSec: 8,
      },
      {
        id: "s7",
        template: "cta",
        narration: `Follow for more. I post one of these every day.`,
        text: { heading: "Follow for daily tips", sub: "@code2offer" },
        durationSec: 4,
      },
    ],
  };
}

// Optional LLM fill-in. Wire a provider here (OpenAI/Anthropic/etc.) to turn
// placeholders into real narration/copy. Left as a no-op so the scaffolder has
// zero credential requirements by default.
async function fillWithLLM<T>(storyboard: T): Promise<T> {
  // if (process.env.OPENAI_API_KEY) { ...call model, map results... }
  return storyboard;
}

export async function scaffold(argv: string[]) {
  const args = parseArgs(argv);
  let sb = buildStoryboard(args);
  sb = await fillWithLLM(sb);
  assertValidStoryboard(sb, args.lang);

  const out = path.join(ROOT, "input", `storyboard.${args.lang}.json`);
  await fs.writeFile(out, JSON.stringify(sb, null, 2));
  console.log(`[scaffold] wrote ${out}`);
  console.log(
    `[scaffold] topic="${args.topic}" look=${args.look} platform=${args.platform}`,
  );
  console.log(
    `[scaffold] next: edit narration/code/stat, then: npm run make -- ${args.lang} --eleven`,
  );
  return out;
}

if (process.argv[1] && process.argv[1].endsWith("scaffold.ts")) {
  scaffold(process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
