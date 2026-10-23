# Brand components (Remotion)

Persistent brand layers. Put in `src/remotion/components/brand/`. They read the loaded brand profile (pass it through `defaultProps` alongside the storyboard).

## Watermark — logo + handle on every frame
Rendered above all scenes for the whole video, inside the safe-zone corner.
```tsx
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";

export const Watermark: React.FC<{ brand: any }> = ({ brand }) => {
  const wm = brand?.watermark;
  if (!wm?.enabled) return null;
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const pad = { x: width * 0.05, y: height * (vertical ? 0.06 : 0.05) };
  const pos: React.CSSProperties = { position: "absolute" };
  if (wm.position.includes("top")) pos.top = pad.y; else pos.bottom = pad.y;
  if (wm.position.includes("left")) pos.left = pad.x; else pos.right = pad.x;
  const logoH = Math.round(height * 0.045 * (wm.scale ?? 1));

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...pos, opacity: wm.opacity ?? 0.85, display: "flex", alignItems: "center", gap: 10 }}>
        {(wm.element === "logo" || wm.element === "both") && brand.logo?.src ? (
          <Img src={staticFile(brand.logo.src)} style={{ height: logoH }} />
        ) : null}
        {(wm.element === "handle" || wm.element === "both") ? (
          <span style={{ color: brand.colors?.textOnPrimary ?? "#fff", fontFamily: brand.fonts?.body,
            fontSize: Math.round(logoH * 0.7), fontWeight: 800, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
            {brand.handle}
          </span>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
```

## Intro — brand logo reveal sting
```tsx
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Lottie } from "@remotion/lottie";

export const Intro: React.FC<{ brand: any }> = ({ brand }) => {
  const intro = brand?.intro;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!intro?.enabled || intro.type === "none") return null;

  if (intro.type === "logo") {
    const p = spring({ frame, fps, config: { damping: 120 } });
    const out = interpolate(frame, [intro.durationSec * fps - 8, intro.durationSec * fps], [1, 0], { extrapolateLeft: "clamp" });
    return (
      <AbsoluteFill style={{ backgroundColor: brand.colors?.primary, justifyContent: "center", alignItems: "center", opacity: out }}>
        {brand.logo?.lockupSrc || brand.logo?.src ? (
          <Img src={staticFile(brand.logo.lockupSrc ?? brand.logo.src)}
            style={{ height: "22%", opacity: p, transform: `scale(${0.85 + p * 0.15})` }} />
        ) : (
          <div style={{ color: brand.colors?.accent, fontFamily: brand.fonts?.display, fontWeight: 900,
            fontSize: 120, opacity: p, transform: `scale(${0.85 + p * 0.15})` }}>{brand.channel}</div>
        )}
      </AbsoluteFill>
    );
  }
  // lottie / video intro
  return <AbsoluteFill style={{ backgroundColor: brand.colors?.primary }}>{/* <Lottie|OffthreadVideo src=intro.src /> */}</AbsoluteFill>;
};
```

## Outro — CTA / end card
```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { SafeZone } from "../SafeZone";

export const Outro: React.FC<{ brand: any }> = ({ brand }) => {
  const o = brand?.outro;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!o?.enabled) return null;
  const p = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors?.accent, color: brand.colors?.textOnPrimary, fontFamily: brand.fonts?.display }}>
      <SafeZone>
        <div style={{ textAlign: "center", opacity: p, transform: `scale(${0.9 + p * 0.1})` }}>
          <h1 style={{ fontSize: 92, fontWeight: 900, margin: 0 }}>{o.headline}</h1>
          {o.sub ? <p style={{ fontSize: 48, opacity: 0.95, marginTop: 16 }}>{o.sub}</p> : null}
          {o.showSubscribe ? <div style={{ marginTop: 32, fontSize: 40, fontWeight: 800,
            border: "3px solid currentColor", borderRadius: 999, padding: "10px 34px", display: "inline-block" }}>
            Subscribe ▸</div> : null}
        </div>
      </SafeZone>
    </AbsoluteFill>
  );
};
```

## Wiring in Video.tsx
```tsx
// brand passed via defaultProps alongside storyboard
<AbsoluteFill>
  <TransitionSeries>
    {brand.intro?.enabled && (
      <>
        <TransitionSeries.Sequence durationInFrames={Math.round(brand.intro.durationSec * fps)}>
          <Intro brand={brand} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 8 })} />
      </>
    )}
    {/* ...storyboard scene sequences... */}
    {brand.outro?.enabled && (
      <TransitionSeries.Sequence durationInFrames={Math.round(brand.outro.durationSec * fps)}>
        <Outro brand={brand} />
      </TransitionSeries.Sequence>
    )}
  </TransitionSeries>
  <Audio src={staticFile("narration/full.wav")} />
  <Captions pages={captions.pages} style={brand.captionStyle} accent={brand.captionAccent} font={brand.fonts?.body} />
  <Watermark brand={brand} />   {/* above everything, whole duration */}
</AbsoluteFill>
```
Remember to include the intro/outro durations when computing `durationInFrames` in `Root.tsx`, and to load `brand.fonts.files` before render.
