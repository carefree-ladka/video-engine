---
name: video-studio
description: Scaffold or locate the reusable video-studio project (Remotion + FFmpeg + Whisper + TTS) and choose the platform preset. Use at the START of any video job to set up the project, install dependencies, and lock resolution/fps/duration/safe-zones for YouTube, Shorts, Reels, IG feed or Stories.
---

# video-studio — setup & platform presets

This is stage 1 of the video pipeline. Goal: a ready project and a locked platform preset before any storyboard/voice/render work.

## 1. Locate or scaffold the project

If a `video-studio/` folder already exists in the workspace with a `package.json` that lists `remotion`, reuse it. Otherwise scaffold it following `references/project-structure.md` — create the folder tree, write `package.json`, `tsconfig.json`, the Remotion entry files, and the pipeline scripts.

Then install:

```bash
cd video-studio
npm install
```

System prerequisites (check, don't reinstall if present):

```bash
ffmpeg -version   # install via: brew install ffmpeg
node -v            # Node 18+ required by Remotion
```

Whisper.cpp is installed on first caption run by the video-captions skill — no manual step here.

The scaffold's `package.json` already includes the free Remotion-native animation packages (`@remotion/transitions`, `@remotion/shapes`, `@remotion/paths`, `@remotion/animation-utils`, `@remotion/motion-blur`, `@remotion/lottie`) plus GSAP as an optional dependency. For how/when to use each one safely (frame-driven rule), see `references/motion-libraries.md` in the video-render skill.

> License note (say once): Remotion is free for individuals and small teams but requires a paid company license above a size threshold. GSAP (incl. all plugins) and Lottie rendering are free for commercial use.

## 2. Pick the platform preset

Ask the user (or infer from their request) which target they want, then set `format` in `video-studio/config.ts`. Full table in `references/platform-specs.md`. Quick reference:

| Target    | Resolution | Aspect | FPS | Max length     |
| --------- | ---------- | ------ | --- | -------------- |
| youtube   | 1920×1080  | 16:9   | 30  | —              |
| short     | 1080×1920  | 9:16   | 30  | 60s (up to 3m) |
| reel      | 1080×1920  | 9:16   | 30  | 90s            |
| story     | 1080×1920  | 9:16   | 30  | 60s            |
| ig-feed   | 1080×1350  | 4:5    | 30  | 60s            |
| ig-square | 1080×1080  | 1:1    | 30  | 60s            |

For vertical formats, keep all key text/graphics inside the **safe zone** (avoid top ~10% and bottom ~20% where platform UI sits). The scene templates already enforce this.

## 3. Hand off

Once the project exists and the preset is set, confirm back to the user:

- project path, chosen preset (resolution/fps/max length), and voice provider (local vs ElevenLabs).

Then proceed to the **video-brand-kit** skill (load or create the channel brand), and from there to **video-storyboard**.

## Supporting files

- `references/project-structure.md` — exact folder tree, package.json, config.ts, Remotion entry.
- `references/platform-specs.md` — per-platform resolution, duration, safe zones, encoding settings.
