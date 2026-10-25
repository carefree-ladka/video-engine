// Exercises the async job engine with cheap, isolated steps (throwaway lang
// "zz"): scaffold a storyboard, then run a synthetic-captions JOB and poll it
// to completion. Cleans up after itself. No TTS / no render.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LANG = "zz";
const textOf = (r) => r?.content?.map((c) => c.text).join("\n") ?? "";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const transport = new StdioClientTransport({
    command: path.join(ROOT, "node_modules", ".bin", "tsx"),
    args: [path.join(ROOT, "src", "mcp", "server.ts")],
    cwd: ROOT,
  });
  const client = new Client({ name: "job-smoke", version: "1.0.0" });
  await client.connect(transport);

  const sc = JSON.parse(
    textOf(await client.callTool({ name: "scaffold_storyboard", arguments: { topic: "Job Engine Test", lang: LANG } })),
  );
  console.log("scaffold ok:", sc.ok, sc.file);

  const job = JSON.parse(
    textOf(await client.callTool({ name: "generate_captions", arguments: { lang: LANG, mode: "synthetic" } })),
  );
  console.log("enqueued job:", job.jobId, job.status);

  let status;
  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    status = JSON.parse(
      textOf(await client.callTool({ name: "get_job_status", arguments: { jobId: job.jobId, logLines: 5 } })),
    );
    if (["completed", "failed", "cancelled"].includes(status.status)) break;
  }
  console.log("final status:", status.status, "outputs:", status.outputs);
  if (status.status !== "completed") {
    console.error("JOB FAILED:", status.error, status.logTail);
    process.exit(1);
  }

  await client.close();
  for (const f of [`storyboard.${LANG}.json`, `captions.${LANG}.json`, `storyboard.${LANG}.bak.json`]) {
    await fs.rm(path.join(ROOT, "input", f), { force: true });
  }
  await fs.rm(path.join(ROOT, "tmp", LANG), { recursive: true, force: true });
  console.log("JOB SMOKE OK");
}

main().catch((e) => {
  console.error("JOB SMOKE FAILED:", e);
  process.exit(1);
});
