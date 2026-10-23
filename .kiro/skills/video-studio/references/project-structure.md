# video-studio — project structure

Scaffold this tree in the workspace (create missing files; never clobber a user's existing `assets/` or `input/`).

```
video-studio/
  assets/                 # user drops images, video clips, music here
  input/
    script.md             # or script.json — narration + scene notes
  out/                    # rendered mp4 + srt (gitignored)
  src/
    config.ts             # platform preset, voice provider, theme
    pipeline/
      1-parse-script.ts   # script -> storyboard.json
      2-voiceover.ts      # storyboard -> narration/*.wav
      3-captions.ts       # narration -> captions.json (whisper)
      4-render.ts         # storyboard+audio+captions -> out/video.mp4
      lib/
        ffprobe.ts        # measure audio duration
    remotion/
      index.ts            # registerRoot
      Root.tsx            # <Composition> registry
      Video.tsx           # timeline: maps storyboard scenes -> <Sequence>
      scenes/             # TitleScene, ImageScene, BulletScene, QuoteScene...
      components/
        Captions.tsx      # word-synced animated captions
        SafeZone.tsx      # platform-aware padding
  storyboard.json         # generated, editable
  captions.json           # generated
  .env.example            # ELEVENLABS_API_KEY=
  .gitignore              # node_modules, out, .env, whisper.cpp, narration
  package.json
  tsconfig.json
  remotion.config.ts
```

## package.json

```json
{
  "name": "video-studio",
  "private": true,
  "type": "module",
  "scripts": {
    "studio": "remotion studio src/remotion/index.ts",
    "parse": "tsx src/pipeline/1-parse-script.ts",
    "voice": "tsx src/pipeline/2-voiceover.ts",
    "captions": "tsx src/pipeline/3-captions.ts",
    "render": "tsx src/pipeline/4-render.ts",
    "make": "npm run parse && npm run voice && npm run captions && npm run render"
  },
  "dependencies": {
    "@remotion/bundler": "^4.0.0",
    "@remotion/captions": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/install-whisper-cpp": "^4.0.0",
    "@remotion/media-utils": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "@remotion/transitions": "^4.0.0",
    "@remotion/shapes": "^4.0.0",
    "@remotion/paths": "^4.0.0",
    "@remotion/animation-utils": "^4.0.0",
    "@remotion/motion-blur": "^4.0.0",
    "@remotion/lottie": "^4.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "remotion": "^4.0.0"
  },
  "optionalDependencies": {
    "gsap": "^3.12.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "dotenv": "^16.4.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

Pin to the latest Remotion 4.x at scaffold time (`npm view remotion version`) and keep every `@remotion/*` package on the exact same version — mismatched Remotion package versions fail to render.

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ESNext", "DOM"]
  },
  "include": ["src"]
}
```

## src/config.ts

```ts
export type Platform =
  | "youtube"
  | "short"
  | "reel"
  | "story"
  | "ig-feed"
  | "ig-square";

export const PRESETS: Record<
  Platform,
  { width: number; height: number; fps: number; maxSeconds: number }
> = {
  youtube: { width: 1920, height: 1080, fps: 30, maxSeconds: 0 },
  short: { width: 1080, height: 1920, fps: 30, maxSeconds: 60 },
  reel: { width: 1080, height: 1920, fps: 30, maxSeconds: 90 },
  story: { width: 1080, height: 1920, fps: 30, maxSeconds: 60 },
  "ig-feed": { width: 1080, height: 1350, fps: 30, maxSeconds: 60 },
  "ig-square": { width: 1080, height: 1080, fps: 30, maxSeconds: 60 },
};

export const config = {
  platform: "short" as Platform, // set per job
  language: "en" as string, // active language: en | hi | hi-Latn ...
  languages: ["en"] as string[], // >1 => render one version per language
  voice: {
    provider: "local" as "local" | "elevenlabs",
    modelId: "eleven_multilingual_v2", // multilingual => Hindi + code-switching
    byLanguage: {
      en: {
        elevenlabsVoiceId: "Rachel",
        sayVoice: "Samantha",
        piperModel: "en_US-amy-medium.onnx",
      },
      hi: { elevenlabsVoiceId: "", sayVoice: "Lekha", piperModel: "" },
    } as Record<
      string,
      { elevenlabsVoiceId: string; sayVoice: string; piperModel: string }
    >,
  },
  // Whisper per language — non-English needs a multilingual model (NOT the .en ones)
  whisperByLanguage: {
    en: { model: "medium.en", language: "en" },
    hi: { model: "medium", language: "hi" },
  } as Record<string, { model: string; language: string }>,
  theme: {
    bg: "#0B0B0F",
    fg: "#FFFFFF",
    accent: "#FF3366",
    // dual-script stack: Devanagari (Hind/Noto) + Latin (Inter) so Hindi isn't rendered as boxes
    font: "Hind, 'Noto Sans Devanagari', Inter, system-ui, sans-serif",
  },
};

export const activePreset = () => PRESETS[config.platform];
```

## src/remotion/index.ts

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

## src/remotion/Root.tsx

```tsx
import { Composition } from "remotion";
import { Video } from "./Video";
import { activePreset, config } from "../config";
import storyboard from "../../storyboard.json";

export const RemotionRoot: React.FC = () => {
  const p = activePreset();
  const totalFrames = Math.max(1, Math.round(storyboard.totalSeconds * p.fps));
  return (
    <Composition
      id="MainVideo"
      component={Video}
      durationInFrames={totalFrames}
      fps={p.fps}
      width={p.width}
      height={p.height}
      defaultProps={{ storyboard, theme: config.theme }}
    />
  );
};
```

`Video.tsx` maps `storyboard.scenes` to `<Sequence>` blocks, each rendering a scene template from `scenes/` plus the `<Captions>` and an `<Audio>` track. See the video-render skill for scene templates and the render script.
