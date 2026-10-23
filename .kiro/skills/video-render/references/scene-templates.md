# Scene template catalog

Drop these in `src/remotion/scenes/` and register them in a `SCENES` map keyed by template name. Each takes `{ scene, theme }`. They rely on `SafeZone` and the motion recipes. Keep type large and high-contrast for mobile.

## scenes/index.ts

```ts
import { TitleScene } from "./TitleScene";
import { ImageScene } from "./ImageScene";
import { BulletsScene } from "./BulletsScene";
import { QuoteScene } from "./QuoteScene";
import { BrollScene } from "./BrollScene";
import { LowerThirdScene } from "./LowerThirdScene";
import { CtaScene } from "./CtaScene";

import { NumberScene } from "./NumberScene";
import { StepsScene } from "./StepsScene";
import { LottieScene } from "./LottieScene";

export const SCENES: Record<string, React.FC<any>> = {
  title: TitleScene,
  image: ImageScene,
  bullets: BulletsScene,
  quote: QuoteScene,
  broll: BrollScene,
  "lower-third": LowerThirdScene,
  cta: CtaScene,
  number: NumberScene,
  steps: StepsScene,
  lottie: LottieScene,
};
```

All templates read styling from `theme` (which the storyboard's `style.palette`/`font` is mirrored into), so the same component looks different per video.

## TitleScene — word pop-in headline

```tsx
import { AbsoluteFill } from "remotion";
import { SafeZone } from "../components/SafeZone";
import { useEnter } from "../components/motion";

export const TitleScene: React.FC<any> = ({ scene, theme }) => {
  const words = (scene.text?.heading ?? "").split(" ");
  const sub = scene.text?.sub;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        color: theme.fg,
        fontFamily: theme.font,
      }}
    >
      <SafeZone>
        <h1
          style={{ fontSize: 96, fontWeight: 900, margin: 0, lineHeight: 1.05 }}
        >
          {words.map((w: string, i: number) => {
            const p = useEnter(i * 3);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 24}px)`,
                  marginRight: 16,
                }}
              >
                {w}
              </span>
            );
          })}
        </h1>
        {sub ? (
          <p style={{ fontSize: 44, opacity: 0.8, marginTop: 24 }}>{sub}</p>
        ) : null}
      </SafeZone>
    </AbsoluteFill>
  );
};
```

## ImageScene — Ken Burns photo with gradient + caption room

```tsx
import { AbsoluteFill, staticFile } from "remotion";
import { KenBurns } from "../components/motion";
import { SafeZone } from "../components/SafeZone";

export const ImageScene: React.FC<any> = ({ scene, theme }) => (
  <AbsoluteFill>
    {scene.asset ? <KenBurns src={staticFile(scene.asset)} /> : null}
    <AbsoluteFill
      style={{
        background: "linear-gradient(transparent 40%, rgba(0,0,0,0.75))",
      }}
    />
    <SafeZone>
      {scene.text?.heading ? (
        <h2
          style={{
            color: theme.fg,
            fontFamily: theme.font,
            fontSize: 72,
            fontWeight: 800,
            alignSelf: "flex-start",
          }}
        >
          {scene.text.heading}
        </h2>
      ) : null}
    </SafeZone>
  </AbsoluteFill>
);
```

## BulletsScene — staggered list

```tsx
import { AbsoluteFill } from "remotion";
import { SafeZone } from "../components/SafeZone";
import { useEnter } from "../components/motion";

export const BulletsScene: React.FC<any> = ({ scene, theme }) => (
  <AbsoluteFill
    style={{
      backgroundColor: theme.bg,
      color: theme.fg,
      fontFamily: theme.font,
    }}
  >
    <SafeZone>
      {scene.text?.heading ? (
        <h2 style={{ fontSize: 72, fontWeight: 900, marginBottom: 32 }}>
          {scene.text.heading}
        </h2>
      ) : null}
      {(scene.text?.bullets ?? []).map((b: string, i: number) => {
        const p = useEnter(10 + i * 8);
        return (
          <div
            key={i}
            style={{
              fontSize: 52,
              margin: "14px 0",
              opacity: p,
              transform: `translateX(${(1 - p) * 40}px)`,
            }}
          >
            <span style={{ color: theme.accent, marginRight: 16 }}>▸</span>
            {b}
          </div>
        );
      })}
    </SafeZone>
  </AbsoluteFill>
);
```

## QuoteScene — big centered quote

```tsx
import { AbsoluteFill } from "remotion";
import { SafeZone } from "../components/SafeZone";

export const QuoteScene: React.FC<any> = ({ scene, theme }) => (
  <AbsoluteFill
    style={{
      backgroundColor: theme.bg,
      color: theme.fg,
      fontFamily: theme.font,
    }}
  >
    <SafeZone>
      <p style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.2 }}>
        <span style={{ color: theme.accent }}>“</span>
        {scene.text?.heading}
        <span style={{ color: theme.accent }}>”</span>
      </p>
      {scene.text?.sub ? (
        <p style={{ fontSize: 40, opacity: 0.7, marginTop: 24 }}>
          — {scene.text.sub}
        </p>
      ) : null}
    </SafeZone>
  </AbsoluteFill>
);
```

## BrollScene — full-bleed video clip

```tsx
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

export const BrollScene: React.FC<any> = ({ scene }) => (
  <AbsoluteFill>
    {scene.asset ? (
      <OffthreadVideo
        src={staticFile(scene.asset)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        muted
      />
    ) : null}
  </AbsoluteFill>
);
```

Use `<OffthreadVideo>` (not `<Video>`) for embedded clips — it's more reliable during render.

## LowerThirdScene — name/label strip over b-roll

```tsx
import { AbsoluteFill, staticFile, OffthreadVideo } from "remotion";
import { useEnter } from "../components/motion";

export const LowerThirdScene: React.FC<any> = ({ scene, theme }) => {
  const p = useEnter(6);
  return (
    <AbsoluteFill>
      {scene.asset ? (
        <OffthreadVideo
          src={staticFile(scene.asset)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 60,
          bottom: "24%",
          opacity: p,
          transform: `translateX(${(1 - p) * -60}px)`,
          background: theme.accent,
          color: "#fff",
          padding: "14px 28px",
          fontFamily: theme.font,
          fontSize: 48,
          fontWeight: 800,
          borderRadius: 8,
        }}
      >
        {scene.text?.heading}
      </div>
    </AbsoluteFill>
  );
};
```

## CtaScene — follow/subscribe end card

```tsx
import { AbsoluteFill } from "remotion";
import { SafeZone } from "../components/SafeZone";
import { useEnter } from "../components/motion";

export const CtaScene: React.FC<any> = ({ scene, theme }) => {
  const p = useEnter();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.accent,
        color: "#fff",
        fontFamily: theme.font,
      }}
    >
      <SafeZone>
        <div
          style={{
            textAlign: "center",
            opacity: p,
            transform: `scale(${0.9 + p * 0.1})`,
          }}
        >
          <h1 style={{ fontSize: 88, fontWeight: 900 }}>
            {scene.text?.heading ?? "Follow for more"}
          </h1>
          {scene.text?.sub ? (
            <p style={{ fontSize: 44, opacity: 0.9 }}>{scene.text.sub}</p>
          ) : null}
        </div>
      </SafeZone>
    </AbsoluteFill>
  );
};
```

## NumberScene — animated count-up for stats

```tsx
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { SafeZone } from "../components/SafeZone";

export const NumberScene: React.FC<any> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = String(scene.text?.value ?? "0");
  const target = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
  const suffix = raw.replace(/[0-9.,]/g, ""); // %, x, K, +, etc.
  const p = interpolate(frame, [0, fps], [0, 1], { extrapolateRight: "clamp" });
  const shown = Math.round(target * p);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        color: theme.fg,
        fontFamily: theme.font,
      }}
    >
      <SafeZone>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 200,
              fontWeight: 900,
              color: theme.accent,
              lineHeight: 1,
            }}
          >
            {shown.toLocaleString()}
            {suffix}
          </div>
          {scene.text?.heading ? (
            <div style={{ fontSize: 56, marginTop: 20 }}>
              {scene.text.heading}
            </div>
          ) : null}
        </div>
      </SafeZone>
    </AbsoluteFill>
  );
};
```

## StepsScene — sequential steps with a connecting draw

```tsx
import { AbsoluteFill } from "remotion";
import { SafeZone } from "../components/SafeZone";
import { useEnter } from "../components/motion";

export const StepsScene: React.FC<any> = ({ scene, theme }) => (
  <AbsoluteFill
    style={{
      backgroundColor: theme.bg,
      color: theme.fg,
      fontFamily: theme.font,
    }}
  >
    <SafeZone>
      {scene.text?.heading ? (
        <h2 style={{ fontSize: 64, fontWeight: 900, marginBottom: 28 }}>
          {scene.text.heading}
        </h2>
      ) : null}
      {(scene.text?.bullets ?? []).map((b: string, i: number) => {
        const p = useEnter(8 + i * 10);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              margin: "18px 0",
              opacity: p,
              transform: `translateY(${(1 - p) * 30}px)`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: theme.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 900,
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontSize: 48 }}>{b}</div>
          </div>
        );
      })}
    </SafeZone>
  </AbsoluteFill>
);
```

## LottieScene — illustrated motion graphic (After Effects/LottieFiles JSON)

```tsx
import {
  AbsoluteFill,
  staticFile,
  continueRender,
  delayRender,
} from "remotion";
import { Lottie } from "@remotion/lottie";
import { useEffect, useState } from "react";
import { SafeZone } from "../components/SafeZone";

export const LottieScene: React.FC<any> = ({ scene, theme }) => {
  const [data, setData] = useState<any>(null);
  const [handle] = useState(() => delayRender("lottie"));
  useEffect(() => {
    fetch(staticFile(scene.lottie))
      .then((r) => r.json())
      .then((j) => {
        setData(j);
        continueRender(handle);
      });
  }, [handle, scene.lottie]);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {data ? <Lottie animationData={data} /> : null}
      {scene.text?.heading ? (
        <SafeZone>
          <h2
            style={{
              color: theme.fg,
              fontFamily: theme.font,
              fontSize: 64,
              fontWeight: 900,
              alignSelf: "center",
              textAlign: "center",
            }}
          >
            {scene.text.heading}
          </h2>
        </SafeZone>
      ) : null}
    </AbsoluteFill>
  );
};
```

Put `useEnter` and `KenBurns` in `src/remotion/components/motion.tsx` (from the motion-recipes reference).
