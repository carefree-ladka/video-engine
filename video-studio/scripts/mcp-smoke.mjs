// End-to-end smoke test for the video-studio MCP server.
// Spawns the server over stdio using the official MCP client and exercises the
// read-only tools plus validation. Does NOT start a render (that's a long job).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function textOf(res) {
  return res?.content?.map((c) => c.text).join("\n") ?? "";
}

async function main() {
  const transport = new StdioClientTransport({
    command: path.join(ROOT, "node_modules", ".bin", "tsx"),
    args: [path.join(ROOT, "src", "mcp", "server.ts")],
    cwd: ROOT,
  });
  const client = new Client({ name: "smoke", version: "1.0.0" });
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log(`tools (${tools.length}):`, tools.map((t) => t.name).join(", "));

  // discovery must parse
  JSON.parse(textOf(await client.callTool({ name: "describe_storyboard_format", arguments: {} })));
  const tmpl = JSON.parse(textOf(await client.callTool({ name: "list_templates", arguments: {} })));
  console.log("templates:", Object.keys(tmpl.templates).join(", "));

  // validation (bad + good)
  const bad = await client.callTool({
    name: "validate_storyboard",
    arguments: { storyboard: { width: 1080, height: 1920, fps: 30, scenes: [{ id: "x", template: "nope" }] } },
  });
  console.log("validate(bad) valid:", JSON.parse(textOf(bad)).valid === false);
  const good = await client.callTool({
    name: "validate_storyboard",
    arguments: {
      storyboard: {
        width: 1080, height: 1920, fps: 30,
        scenes: [{ id: "s1", template: "hook", narration: "hi", text: { heading: "Hello" } }],
      },
    },
  });
  console.log("validate(good) valid:", JSON.parse(textOf(good)).valid === true);

  // audio config + error paths
  JSON.parse(textOf(await client.callTool({ name: "get_audio_config", arguments: {} })));
  const nojob = await client.callTool({ name: "get_job_status", arguments: { jobId: "nope" } });
  console.log("get_job_status(missing) isError:", nojob.isError === true);
  const badlang = await client.callTool({ name: "read_storyboard", arguments: { lang: "../etc" } });
  console.log("read_storyboard(bad lang) isError:", badlang.isError === true);

  await client.close();
  console.log("SMOKE OK");
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e);
  process.exit(1);
});
