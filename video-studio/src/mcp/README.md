# video-studio MCP server

Exposes the video pipeline over the Model Context Protocol so any MCP client
(Kiro, Claude Desktop, Codex, Cursor, your own agent) can author storyboards and
produce videos.

## Run

```bash
npm run mcp        # launches the stdio server
```

It speaks MCP over **stdio**. You normally don't run it by hand — your MCP client
launches it for you via config (below).

## Wiring it into a client

Copy the `video-studio` block from [`../../mcp.example.json`](../../mcp.example.json).

- **Kiro** — add it to `.kiro/settings/mcp.json` (this workspace) or
  `~/.kiro/settings/mcp.json` (all workspaces). Reconnect from the MCP Server view.
- **Claude Desktop** — add it to `claude_desktop_config.json` and restart.
- **Codex / others** — add it to the client's `mcpServers` map.

```json
{
  "mcpServers": {
    "video-studio": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/video-studio/src/mcp/server.ts"],
      "cwd": "/ABSOLUTE/PATH/video-studio"
    }
  }
}
```

## Typical flow for an LLM client

1. `describe_storyboard_format` + `list_templates` + `list_looks` — learn the contract.
2. `validate_storyboard` — check a drafted storyboard object.
3. `write_storyboard` — persist it to `input/storyboard.<lang>.json` (validates first, backs up).
4. `generate_video` — returns a `jobId`.
5. `get_job_status` — poll until `status: completed`; read `outputs` for the mp4 path.

`scaffold_storyboard` is a shortcut for step 2-3 (writes a placeholder skeleton for a topic).

## Tools

### Discovery (read-only, instant)

| Tool                         | Purpose                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| `describe_storyboard_format` | Full storyboard JSON contract + how durations/audio/captions are handled.  |
| `list_templates`             | Every scene template with required/optional fields and an example.         |
| `list_looks`                 | Art-direction look ids for `style.look`.                                   |
| `list_presets`               | Platform presets (resolution, fps, max seconds).                           |
| `list_voices`                | TTS providers and the per-language voice map.                              |
| `get_audio_config`           | Effective music + sfx config (defaults ← brand.json ← storyboard `sound`). |
| `list_sfx_cues`              | Built-in SFX cue names + which have a user override.                       |

### Storyboard CRUD

| Tool                  | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `list_storyboards`    | List `input/storyboard.*.json`.                                      |
| `read_storyboard`     | Return a parsed storyboard.                                          |
| `validate_storyboard` | Validate an object (no write). Returns errors + warnings.            |
| `write_storyboard`    | Validate then write `storyboard.<lang>.json` (backs up existing).    |
| `scaffold_storyboard` | Generate a valid placeholder storyboard for a topic.                 |
| `set_audio_config`    | Toggle music/sfx or change volumes via the storyboard `sound` block. |

### Production (async — return a `jobId`)

| Tool                  | Purpose                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| `generate_video`      | Full pipeline: voiceover → captions → render.                                     |
| `generate_voiceover`  | TTS only; rewrites measured durations into the storyboard.                        |
| `generate_captions`   | `whisper` (word-level; needs prior voiceover + network) or `synthetic` (offline). |
| `render_video`        | Render using existing audio/captions (no TTS).                                    |
| `render_formats`      | Re-render into `vertical` / `square` / `wide` from one bundle.                    |
| `generate_thumbnails` | Short + long thumbnail stills.                                                    |
| `preview_audio`       | Fast audio-only preview of the sound design (music + sfx) — no video render.      |

### Job control & outputs

| Tool              | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `get_job_status`  | status / stage / progress% / quality notes / outputs / log tail. |
| `list_jobs`       | Recent jobs.                                                     |
| `cancel_job`      | Cancel a queued job or terminate a running one.                  |
| `list_outputs`    | Files in `out/` with size + mtime.                               |
| `get_output_info` | ffprobe a produced file.                                         |

## Robustness notes

- **stdout is protected.** The stdio transport owns `process.stdout`; all server
  logging goes to `stderr`, and every pipeline step runs as an **isolated child
  process** whose output is captured. A Remotion/ffmpeg crash kills only the
  child, never the server.
- **Jobs are serialized.** Production steps write to shared files (`out/`,
  `input/captions.*`, `public/narration/*`), so they run one at a time through a
  queue. Extra requests report `status: queued` with a `queuePosition`.
- **Every tool is guarded.** Handlers return a structured `{ ok:false, error }`
  instead of throwing; `lang` is pattern-checked and file paths are confined to
  the project root.
- **Quality is surfaced.** When TTS falls back to `say` or captions fall back to
  synthetic (e.g. a blocked network), the job's `notes` say so, so the caller
  knows the output's fidelity.

## Tests

```bash
node scripts/mcp-smoke.mjs      # tools list + discovery + validation + error paths
node scripts/mcp-job-smoke.mjs  # async job lifecycle (isolated throwaway lang, self-cleaning)
```
