import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const ROOT = process.cwd();

// ---------------------------------------------------------------------------
// Opt-in code runner: execute a scene's snippet in a subprocess and capture its
// real stdout into `text.output`, so the "output block" shows the true result
// instead of a hand-typed guess.
//
// SECURITY: this runs code from the storyboard on your machine. It is OFF by
// default and only touches scenes that set `"run": true`. Each run has a hard
// timeout and no stdin. Only enable it for storyboards you trust. It does NOT
// sandbox the filesystem/network — run untrusted snippets in a container.
// ---------------------------------------------------------------------------

type Runner = { cmd: string; args: (file: string) => string[]; ext: string };
const RUNNERS: Record<string, Runner> = {
  python: { cmd: process.env.PY_BIN || "python3", args: (f) => ["-I", f], ext: "py" },
  node: { cmd: process.env.NODE_BIN || "node", args: (f) => [f], ext: "mjs" },
  bash: { cmd: "bash", args: (f) => [f], ext: "sh" },
};

function langOf(scene: any): string | null {
  const explicit = (scene.runWith || scene.text?.language || "").toLowerCase();
  if (explicit && RUNNERS[explicit]) return explicit;
  const label: string = scene.text?.windowLabel || "";
  if (/\.py$/i.test(label)) return "python";
  if (/\.(mjs|js|ts)$/i.test(label)) return "node";
  if (/\.(sh|zsh|bash)$/i.test(label)) return "bash";
  return null;
}

export async function runCode(lang: string, timeoutMs = 8000) {
  const sbPath = path.join(ROOT, "input", `storyboard.${lang}.json`);
  const sb = JSON.parse(await fs.readFile(sbPath, "utf8"));
  const tmp = path.join(ROOT, "tmp", "runcode");
  await fs.mkdir(tmp, { recursive: true });

  let ran = 0;
  for (const scene of sb.scenes ?? []) {
    if (scene.run !== true) continue;
    const code: string[] = scene.text?.code ?? [];
    if (!code.length) continue;
    const l = langOf(scene);
    if (!l) {
      console.warn(`[runcode] ${scene.id}: can't infer language (set runWith); skipping.`);
      continue;
    }
    const runner = RUNNERS[l];
    const file = path.join(tmp, `${scene.id}.${runner.ext}`);
    await fs.writeFile(file, code.join("\n"));
    try {
      const { stdout, stderr } = await execFileP(runner.cmd, runner.args(file), {
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 8,
        env: { ...process.env },
      });
      const out = (stdout || stderr || "").replace(/\s+$/, "");
      scene.text = scene.text ?? {};
      scene.text.output = out.split("\n").slice(0, 8);
      ran++;
      console.log(`[runcode] ${scene.id} (${l}) -> ${scene.text.output.length} line(s)`);
    } catch (e: any) {
      const msg = (e?.stderr || e?.message || "").toString().split("\n")[0];
      console.warn(`[runcode] ${scene.id} failed: ${msg}`);
      scene.text = scene.text ?? {};
      scene.text.output = [`# error: ${msg}`];
    }
  }

  if (ran > 0) await fs.writeFile(sbPath, JSON.stringify(sb, null, 2));
  console.log(`[runcode:${lang}] executed ${ran} scene(s).`);
  return ran;
}

if (process.argv[1] && process.argv[1].endsWith("runcode.ts")) {
  runCode(process.argv[2] || "en").catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
