---
name: video-render
description: Assemble the Remotion composition from storyboard, narration audio, captions and assets, then render the final MP4 with motion graphics and finalize with FFmpeg. Includes a catalog of polished scene templates and motion recipes. Use as the final stage to produce the video for YouTube/Reels/Shorts.
---

# video-render — compose & render the final video

Stage 5. Build the Remotion timeline from `storyboard.json` + `narration/` + `captions.json` + `assets/`, render to MP4, then run a final FFmpeg pass.

## 1. Timeline (Video.tsx)

Map scenes to sequential `<Sequence>` blocks using cumulative frame offsets from each scene's real `durationSec × fps`. Each sequence renders its template, wraps content in `<SafeZone>`, and the whole video carries one `<Audio src="narration/full.wav">` plus optional ducked music. Captions render on top, driven by the global timeline.

```tsx
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
  staticFile,
} from "remotion";
import { SCENES } from "./scenes";
import { Captions } from "./components/Captions";
import captions from "../../captions.json";

export const Video: React.FC<{ storyboard: any; theme: any }> = ({
  storyboard,
  theme,
}) => {
  const { fps } = useVideoConfig();
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {storyboard.scenes.map((s: any) => {
        const dur = Math.round(s.durationSec * fps);
        const Comp = SCENES[s.template] ?? SCENES.image;
        const el = (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id}>
            <Comp scene={s} theme={theme} />
          </Sequence>
        );
        from += dur;
        return el;
      })}
      <Audio src={staticFile("narration/full.wav")} />
      {storyboard.music && (
        <Audio
          src={staticFile(storyboard.music)}
          volume={Math.pow(10, (storyboard.musicGainDb ?? -22) / 20)}
        />
      )}
      <Captions captions={captions} />
    </AbsoluteFill>
  );
};
```

## 2. Scene templates & motion

Use the catalog in `references/scene-templates.md` (title, image/kenBurns, bullets, quote, broll, lower-third, cta) and the spring/interpolate recipes in `references/motion-recipes.md`. Prefer these over ad-hoc animation. All text stays inside `<SafeZone>`.

## 3. Render (4-render.ts)

```ts
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import path from "path";

const serveUrl = await bundle({
  entryPoint: path.resolve("src/remotion/index.ts"),
});
const composition = await selectComposition({ serveUrl, id: "MainVideo" });

await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: "out/video.raw.mp4",
  // crf: 18, audioBitrate: "192k",  // Remotion encoding options
  onProgress: ({ progress }) =>
    console.log(`render ${(progress * 100).toFixed(0)}%`),
});
```

For a quick preview instead of a full render: `npm run studio` (live Remotion Studio), or render a single scene / lower fps first.

## 4. Final FFmpeg pass

Normalize loudness, ensure compatibility, faststart:

```bash
ffmpeg -y -i out/video.raw.mp4 \
  -af loudnorm=I=-14:TP=-1.5:LRA=11 \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart \
  out/video.mp4
```

To burn captions directly into the pixels (for platforms that strip sidecar subs): add `-vf subtitles=out/captions.srt` (styled) — but prefer the animated Remotion captions for Shorts/Reels.

## 5. Verify (required before reporting done)

```bash
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height \
  -of default=noprint_wrappers=1 out/video.mp4
```

Confirm: duration ≈ storyboard.totalSeconds, resolution matches the preset, and an `audio` stream is present. Report these real numbers to the user. Clean up `out/video.raw.mp4` and any temp 16k wav.

## Supporting files

- `references/scene-templates.md` — ready-to-use scene components.
- `references/motion-recipes.md` — spring/interpolate motion snippets + the Captions and SafeZone components.
- `references/motion-libraries.md` — which free animation libraries to use (Remotion-native `@remotion/*`, Lottie, GSAP) and the frame-driven rule for using them safely.
